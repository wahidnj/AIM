const Assistant = require('../models/assistant');
const Assignment = require('../models/assignment');
const DeletedAssistant = require('../models/deletedAssistant');
const CustomerSubscription = require('../models/customerSubscription');
const BalanceHistory = require('../models/balanceHistory');
const PhoneNumber = require('../models/phoneNumber');
const Function = require('../functions/function');
const Rate = require('../models/rate');
const Customer = require('../models/users');
const CallLog = require('../models/callLogs');
const Package = require('../models/packages');
const sequelize = require("../util/database");
const axios = require('axios');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../functions/redis');
const bcrypt = require('bcrypt');

const options = {
  headers: {
    Authorization: 'Bearer 78079915-4d18-4e9a-99ee-9f5ebf72c6bb',
    'Content-Type': 'application/json'
  }
};

exports.checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      console.log('Authorization header missing');
      return res.status(401).json({ message: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('Bearer token missing');
      return res.status(401).json({ message: 'Bearer token required' });
    }

    // Check if the token exists in Redis
    const userData = await redisClient.hgetall(token);

    if (!userData || Object.keys(userData).length === 0) {
      console.log('Token not found or invalid:', token);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // If token and user data are valid, attach user data to the request and proceed
    req.user = userData;
    next();


  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.testHome = async (req, res, next) => {
  res.json({ message: 'Welcome to the home page!', user: req.user });
};

// Create a new item
exports.registerUser = async (req, res) => {

  const { name, email, phone, password, country } = req.body;

  // Validate user input (you can use libraries like Joi or express-validator for more comprehensive validation)
  if (!name || !email || !phone || !password || !country) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await Customer.create({ name, email, phone, password: hashedPassword, country });
    const token = uuidv4();
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      country: user.country,
      subscription_status: user.subscription_status
    };

    await redisClient.hmset(token, userData);
    await redisClient.expire(token, 600); // Token valid for 10 minutes

    res.json({ token: token });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Error occurred during signup' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validate user input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user by email
    const user = await Customer.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Prepare user data for the session
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      country: user.country,
      subscription_status: user.subscription_status
    };

    // Generate token
    const token = uuidv4();
    await redisClient.hmset(token, userData);
    await redisClient.expire(token, 600); // Token valid for 10 minutes

    // Respond with the token
    res.json({ token: token });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Error occurred during login' });
  }
};

exports.refreshToken = async (req, res) => {

  try {

    if(req.user){
      // Generate a new token
      const newToken = uuidv4();
      // Store user data in the new token
      await redisClient.hmset(newToken, req.user);
      await redisClient.expire(newToken, 600); // Token valid for 10 minutes
      // Delete the old token
      await redisClient.del(req.token);
      // Respond with the new token
      res.json({ token: newToken, user: req.user });
    }else{
      res.status(400).json({ message: 'Authenticate User Not Found' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error occurred during refresh token' });
  }
};

// Reset Password API
exports.resetPassword = async (req, res) => {

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old and new passwords are required' });
  }

  try {

    if (!req.user) {
      console.log('Authenticate User Missing');
      return res.status(401).json({ message: 'Authenticate User Missing' });
    }

    // Check if the token exists in Redis
    const userData = req.user;

    // Find user by ID
    const user = await Customer.findByPk(userData.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

     // Verify the old password
     const isMatch = await bcrypt.compare(oldPassword, user.password);
     if (!isMatch) {
       return res.status(401).json({ message: 'Old password is incorrect' });
     }
     // Hash the new password
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(newPassword, salt);
     // Update user's password
     await user.update({ password: hashedPassword });

     res.json({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error('Error during password reset:', error.message);
    res.status(500).json({ message: 'Error occurred during password reset' });
  }
};

// Create a new item
exports.getRate = async (req, res) => {

  try {
    const provider = req.body.provider;
    const rate = await Rate.findAll({
      where: {
          provider: provider
      },
      attributes: ['id', 'provider', 'voice', 'amount']
    });
    res.json({ success: true, array: rate});
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: 'An error occurred.', error: err.message });
  }
};

exports.webhookVapi = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    console.log(`Received ${req.method} request ${new Date()}`);
    // console.log('Body:', req.body);
    const callId = req.body.call_id;
    if(callId){
      const response = await axios.get(`https://api.vapi.ai/call/${callId}`, options);
      // console.log(response.data);
      if(response.data){
        const assistantId = response.data.assistant.parentId;
        const {id, type, startedAt, endedAt, transcript, summary, recordingUrl, cost, messages, costBreakdown, endedReason} = response.data;
        const phone = (response.data.customer) ? response.data.customer.number : 'web';
        const assistant = await Assistant.findOne({
          where: {
              assistant_id: assistantId
          },
          attributes: ['customer_id'],
          transaction
        });
        if(!assistant){
          res.send('Webhook failed');
          return;
        }

        const customer = await Customer.findOne({
          where: {
              id: assistant.customer_id
          },
          attributes: ['balance'],
          transaction
        });

        if(!customer){
          res.send('Webhook failed');
          return;
        }
        const start = new Date(startedAt);
        const end = new Date(endedAt);
        const duration = (end - start) / 1000;
        const deepgramCost = await Function.costCalculation(duration);

        const subTotal = deepgramCost + cost;

        // Calculate the charges
        const paymentGatewayCharge = parseFloat((subTotal * 0.15).toFixed(3));
        const aimCharge = parseFloat((subTotal * 0.10).toFixed(3));
        
        // Calculate the final total
        const total = parseFloat((subTotal + paymentGatewayCharge + aimCharge).toFixed(3));

        // Update the customer's balance
        const newBalance = parseFloat((customer.balance - total).toFixed(3));
        console.log('duration:', duration, 'deepgramCost:', deepgramCost, 'paymentGatewayCharge:', paymentGatewayCharge,
          'aimCharge:', aimCharge, 'total:', total, 'newBalance', newBalance
        );
        await Customer.update(
          { balance: newBalance },
          { where: { id: assistant.customer_id }, 
          transaction 
        });

        await CallLog.create({
          customer_id: assistant.customer_id, 
          assistant_id: assistantId,
          type: type,
          call_id: id,
          started_at: startedAt,
          ended_at: endedAt,
          transcribe: transcript,
          summary: summary,
          recording_url: recordingUrl,
          vapi_cost: cost,
          deepgram_cost: deepgramCost,
          payment_gateway_cost: paymentGatewayCharge,
          aim_cost: aimCharge,
          total_cost: total,
          message_info: JSON.stringify(messages),
          cost_breakdown: JSON.stringify(costBreakdown),
          end_reason: endedReason,
          phone: phone
        }, { transaction });

        await transaction.commit();
        // Respond with a generic message
        res.send('Webhook received');
      }else{
        res.send('Webhook failed');
      }

    }else{
      res.send('Webhook failed');
    }

  } catch (err) {
    console.log(err.message);
    await transaction.rollback();
    res.status(500).json({ success: false, message: 'An error occurred.', error: err.message });
  }
};

exports.webhookGoogle = async (req, res) => {

  try {
    console.log(`Received ${req.method} request ${new Date()}`);
    console.log('Body:', req.body);

    res.send('Webhook success');


  } catch (err) {
    console.log(err.message);
    await transaction.rollback();
    res.status(500).json({ success: false, message: 'An error occurred.', error: err.message });
  }
};

// Create a new item
exports.getSettings = async (req, res) => {

  try {
    console.log(req.user.name, new Date());
    const customerId = req.user.id;

    const assistant = await Assistant.findOne({
      where: {
        customer_id: customerId,
        status: 1
      }
    });
    res.render('settings',{assistant, user: req.user});
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: 'An error occurred.', error: err.message });
  }
};

// Get all items
exports.getPackageList = async (req, res) => {
  try {
    const packages = await Package.findAll();
    const customerSubs = await CustomerSubscription.findOne({
      where: {
          customer_id: 1
      }
    });
    console.log("get all items");
    res.render('packages',{packages,customerSubs});
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.callDetails = async (req, res) => {
  try {
    const callId = req.params.id;
    const calls = await CallLog.findOne({
      where: {
          id: callId
      }
    });
    
    // if (calls && calls.transcribe) {
    //   const transcribe = JSON.stringify(calls.transcribe);
    //   // const transcribe = calls.transcribe;
    //   const newlineCount = (transcribe.match(/\\n/g) || []).length; // Count the number of \n characters
    //   console.log('Number of \\n characters:', newlineCount); // Log the count
    //   calls.transcribe = transcribe.replace(/\\n/g, '<br>');
    // }
    // console.log(calls.transcribe);
    res.render('call-details',{calls});
  } catch (err) {
    console.log(err.message);
    res.status(500).send(err.message);
  }
};

// Get all items
exports.getBalanceInfo = async (req, res) => {
  try {
    console.log(req.user.name, new Date());
    const customerId = req.user.id;
    const customer = await Customer.findOne({
      where: {
          id: customerId
      }
    });
    const balances = await BalanceHistory.findAll({
      where: {
          customer_id: customerId
      }
    });
    res.render('balance',{balances, customer, user: req.user});
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getNumberInfo = async (req, res) => {
  try {
    console.log(req.user.name, new Date());
    const customerId = req.user.id;
    const numbers = await PhoneNumber.findAll({
      where: {
          customer_id: customerId
      }
    });

    const callLogs = await CallLog.findAll({
      where: {
        customer_id: customerId
      },
      order: [['id', 'DESC']]
    });

    res.render('numbers-info',{numbers, callLogs, user: req.user});
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//show dashboard
exports.showDashboard = async (req, res) => {
  try {
    console.log(req.user.name, new Date());
    const customerId = req.user.id;

    const [totalAssistants, totalAssignments, liveAssistant, callLogs] = await Promise.all([
      Assistant.count({ where: { customer_id: customerId }, order: [['id', 'DESC']] }),
      Assignment.count({ where: { customer_id: customerId }, order: [['id', 'DESC']] }),
      Assistant.findOne({ where: { customer_id: customerId, status: 1 }, order: [['id', 'DESC']] }),
      CallLog.findAll({ where: { customer_id: customerId }, order: [['id', 'DESC']] })
    ]);
    res.render('dashboard', {totalAssignments, totalAssistants, liveAssistant, callLogs, user: req.user});
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Get all agent
exports.getAgentList = async (req, res) => {
  try {
    console.log(req.user.name, new Date());
    const customerId = req.user.id;

    const [assistants, assignments] = await Promise.all([
      Assistant.findAll({ where: { customer_id: customerId }, order: [['id', 'DESC']] }),
      Assignment.findAll({ where: { customer_id: customerId }, attributes: ['name', 'id'], order: [['id', 'DESC']] })
    ]);

    res.render('agent',{assistants, assignments, user: req.user});
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Create a new item
exports.createAssistant = async (req, res) => {

  try {
    const agentName = req.body.agentName;
    const voice = req.body.voice;
    const provider = req.body.provider;
    const body = {
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
        smartFormat: true
      },
      voice: {
        provider: provider,
        voiceId: voice
      },
      firstMessageMode: 'assistant-speaks-first',
      name: agentName,
      recordingEnabled: true,
      endCallFunctionEnabled: true,
      dialKeypadFunctionEnabled: true,
    };
    const response = await axios.post('https://api.vapi.ai/assistant', body, options);
    // Process the data (e.g., save to database, etc.)
    console.log('RESPONSE',response.data);
    console.log('Agent Name:', agentName);
    console.log('Voice:', voice);
    if(response.data){

        await Assistant.create({
          customer_id: 1, 
          assistant_id: response.data.id,
          name: agentName,
          voice: response.data.voice.voiceId,
          provider: provider
        });
      
      // Send a response back to the client
      res.json({ success: true, message: 'Assistant Created successfully!' });
    }else{
      res.status(500).json({ success: false, message: 'An error occurred while submitting the form.'});
    }
  } catch (err) {
    console.log('REQUEST',err.message);
    res.status(500).json({ success: false, message: 'An error occurred while submitting the form.', error: err.message });
  }
};

// Create a new item
exports.updateAssistant = async (req, res) => {
  
  try {
    const { id, name, voice, assignment, provider } = req.body;

    // Find the assignment by ID
    const assistant = await Assistant.findOne({
      where: {
          id: id,
          customer_id: 1
      }
    });
    if (!assistant) {
        return res.status(404).json({ error: 'Assistant not found' });
    }
    const assignments = await Assignment.findOne({
      where: {
          id: assignment,
          customer_id: 1
      }
    });
    
    const body = {
      name: name,
      voice: {
        voiceId: voice,
        provider: provider
      }
    };
    const response = await axios.patch(`https://api.vapi.ai/assistant/${assistant.assistant_id}`, body, options);

    if(response.data){
      // Update assignment fields
      assistant.name = name;
      assistant.voice = voice;
      assistant.assignment = assignment;
      assistant.provider = provider;
      // Save the updated assignment
      await assistant.save();
      // Send success response
      res.status(200).json({ success: true, message: 'Assignment Updated successfully!'  });
    }else{
      res.status(500).json({ success: false, message: 'An error occurred while submitting the form.'});
    }

  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'An error occurred while updating the assignment' });
}

  
};

// Get all agent
exports.getAssignmentList = async (req, res) => {
  try {
    console.log(req.user.name, new Date());
    const customerId = req.user.id;

    const assignments = await Assignment.findAll({
      where: {
        customer_id: customerId
      }
    });
    res.render('assignment',{assignments, user: req.user});
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Create a new item
exports.createAssignment = async (req, res) => {
  
  try {
    const name = req.body.name;
    const message = req.body.message;
    const prompt = req.body.prompt;

    await Assignment.create({
      customer_id: 1, 
      name: name,
      first_message: message,
      prompt: prompt
    });
    
    // Send a response back to the client
    res.json({ success: true, message: 'Assignment Created successfully!' });

  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: 'An error occurred while submitting the form.', error: err.message });
  }

  
};

// Create a new item
exports.updateAssignment = async (req, res) => {
  
  try {
    const { id, name, message, prompt } = req.body;

    // Find the assignment by ID
    const assignment = await Assignment.findOne({
      where: {
          id: id,
          customer_id: 1
      }
    });
    if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
    }
    // Update assignment fields
    assignment.name = name;
    assignment.message = message;
    assignment.prompt = prompt;
    // Save the updated assignment
    await assignment.save();
    // Send success response
    res.status(200).json({ success: true, message: 'Assignment Updated successfully!'  });
  
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'An error occurred while updating the assignment' });
}

  
};

// Create a new item
exports.assignAssignment = async (req, res) => {
  
  try {
    const { id, assignment_id } = req.body;

    // Find the assignment by ID
    const assistant = await Assistant.findOne({
      where: {
          id: id,
          customer_id: 1
      }
    });
    if (!assistant) {
        return res.status(404).json({ error: 'Assignment not found' });
    }
    // Update assignment fields
    assistant.assignment = assignment_id;
    // Save the updated assignment
    await assistant.save();
    // Send success response
    res.status(200).json({ success: true, message: 'Assignment assign successfully!'  });
  
  } catch (error) {
    console.error('Error updating assignment:', error.message);
    res.status(500).json({ error: 'An error occurred while assigning the assignment' });
}

  
};

// Create a new item
exports.updateAssistantStatus= async (req, res) => {
  
  try {
    const { assistantId, status} = req.body;

    // Start a transaction
    await sequelize.transaction(async (t) => {
      // Find the assistant by ID
      const assistant = await Assistant.findOne({
        where: {
          id: assistantId,
          customer_id: 1
        },
        transaction: t
      });

      if (!assistant) {
        return res.status(404).json({ error: 'Assistant not found' });
      }

      // Update the specific assistant's status
      assistant.status = status;
      await assistant.save({ transaction: t });

      if (status == 1) {
        // Update all other assistants' statuses to 0
        await Assistant.update(
          { status: 0 },
          {
            where: {
              // id: { [sequelize.Op.not]: assistantId },
              id: { [Op.not]: assistantId},
              customer_id: 1
            },
            transaction: t
          }
        );
      }else{
        console.log("else");
      }

      // Send success response
      res.status(200).json({ success: true, message: 'Assistant status updated successfully!' });
    });
  } catch (error) {
    console.error('Error updating Assistant:', error);
    res.status(500).json({ error: 'An error occurred while updating the Assistant' });
  }

  
};

// Get all agent
exports.agentDetails = async (req, res) => {
  try {
    const assistantId = req.params.id;
  
    try {
      // Fetch the assistant details using findOne
      const assistant = await Assistant.findOne({
        where: { id: assistantId }
      });
  
      if (!assistant) {
        return res.status(404).send('Assistant not found');
      }

      const rate = await Rate.findAll({
        where: {
            provider: assistant.provider
        },
        attributes: ['id', 'provider', 'voice', 'amount']
      });

      const assignments = await Assignment.findAll({
          where: {
              customer_id: 1
          },
          attributes: ['name', 'id']
      });
      // Render the details page with the fetched data
      res.render('agent-details', { assistant, assignments, rate });
    } catch (error) {
      console.error('Error fetching assistant details:', error);
      res.status(500).send('Internal Server Error');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Create a new item
exports.deleteAssistant = async (req, res) => {
  
  try {
    const { id} = req.body;

    // Find the assistant by ID
    const assistant = await Assistant.findOne({
      where: { id: id }
    });

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }
    const response = await axios.delete(`https://api.vapi.ai/assistant/${assistant.assistant_id}`, options);

    if(response.data){
        // Save deleted assistant info in DeletedAssistant table
        await DeletedAssistant.create({
          assistant_id: assistant.id,
          customer_id: assistant.customer_id,
          name: assistant.name,
          voice: assistant.voice,
          provider: assistant.provider,
          assistant_vapi_id: assistant.assistant_id,
        });

        // Delete the assistant from the Assistant table
        await Assistant.destroy({
          where: { id: id }
        });
        res.status(200).json({ success: true, message: 'Assistant deleted successfully' });
    }else{
        res.status(500).json({ error: 'An error occurred while updating the Assistant' });
    }


  } catch (error) {
    console.error('Error updating Assistant:', error);
    res.status(500).json({ error: 'An error occurred while updating the Assistant' });
  }

  
};

// Create a new item
exports.deleteAssignment = async (req, res) => {
  
  try {
    const { id} = req.body;

    const assistant = await Assistant.findOne({
      where: { assignment: id }
    });

    if (assistant) {
      return res.status(404).json({ error: 'Assignment is assigned to Assistant' });
    }
    // Find the assistant by ID
    const assignment = await Assignment.findOne({
      where: { id: id }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Delete the assistant from the Assistant table
    await Assignment.destroy({
      where: { id: id }
    });
    res.status(200).json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting Assignment:', error);
    res.status(500).json({ error: 'An error occurred while deleting the Assignment' });
  }

  
};

// Create a new item
exports.updateSetting = async (req, res) => {
  
  try {
    const { id, recording, backgroundSound } = req.body;

    // Find the assignment by ID
    const assistant = await Assistant.findOne({
      where: {
          id: id,
          customer_id: 1
      }
    });
    if (!assistant) {
        return res.status(404).json({ error: 'Assistant not found' });
    }
    const recordingEnabled = (recording === 'true') ? true : false; 
    const body = {
      recordingEnabled: recordingEnabled,
      backgroundSound: 'office'
    };
    const response = await axios.patch(`https://api.vapi.ai/assistant/${assistant.assistant_id}`, body, options);

    if(response.data){
      // Update assignment fields
      assistant.recording = recording;
      assistant.backgroundSound = backgroundSound;
      // Save the updated assignment
      await assistant.save();
      // Send success response
      res.status(200).json({ success: true, message: 'Assignment Updated successfully!'  });
    }else{
      res.status(500).json({ success: false, message: 'An error occurred while submitting the form.'});
    }

  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'An error occurred while updating the assignment' });
}

  
};

