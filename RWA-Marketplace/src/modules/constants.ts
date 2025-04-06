export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || "0xc490c84Df329Ed2fce87e8688b61f4506B1EF685";
export const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS || "0x34De2FC59c60da41Ff896DE074923e2616f1bCAf";
export const MAX_ACTIVITIES = 10;

export const validateEnv = () => {
  const requiredVars = {
    TOKEN_ADDRESS: import.meta.env.VITE_TOKEN_ADDRESS,
    MARKETPLACE_ADDRESS: import.meta.env.VITE_MARKETPLACE_ADDRESS
  };

  console.log('Environment Variables:', {
    ...requiredVars,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV
  });

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};