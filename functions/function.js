const costPerPulse = 0.005; // cost per 10 seconds
const pulseRate = 10; // 10-second pulse rate


module.exports = {
  costCalculation: async function (duration) {
    try {
        // Validate input types
        if (typeof duration !== 'number') {
            return null;
        }
    
        // Validate input values
        if (duration <= 0) {
            return null;
        }
    
        // Calculate the number of pulses
        const numberOfPulses = Math.ceil(duration / pulseRate);
    
        // Calculate the total cost
        const totalCost = numberOfPulses * costPerPulse;
    
        return totalCost;
      } catch (error) {
        console.error(`Error: ${error.message}`);
        return null; // or you can return an error message or object
      }
  },

};
