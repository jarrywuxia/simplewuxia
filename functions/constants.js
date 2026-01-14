// functions/constants.js

exports.REALMS = [
  { 
    name: 'Spirit Gathering', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    // XP needed to clear: Initial, Early, Intermediate, Late, Peak
    stageXp: [100, 120, 140, 160, 200] 
  },
  { 
    name: 'Body Refinement', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [300, 350, 400, 450, 600] 
  },
  { 
    name: 'Foundation Establishment', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [1000, 1200, 1400, 1600, 2000] 
  },
  { 
    name: 'Golden Core', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [3000, 3500, 4000, 4500, 6000] 
  },
  { 
    name: 'Nascent Soul', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [10000, 12000, 14000, 16000, 25000] 
  },
  { 
    name: 'Unity', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [50000, 60000, 70000, 80000, 100000] 
  },
  { 
    name: 'Incarnation', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [200000, 250000, 300000, 350000, 500000] 
  },
  { 
    name: 'Divine', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [1000000, 1200000, 1400000, 1600000, 2000000] 
  },
  { 
    name: 'Heavenly Tribulation', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [5000000, 6000000, 7000000, 8000000, 10000000] 
  },
  { 
    name: 'Tribulation Transcendent', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [20000000, 25000000, 30000000, 35000000, 50000000] 
  },
  { 
    name: 'Voidbreak', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [100000000, 120000000, 140000000, 160000000, 200000000] 
  }
];

exports.STAT_POINTS_PER_STAGE = 5;
exports.DEEP_MEDITATION_COST = 20;
// We removed XP_PER_STAGE because we are now using the specific arrays above