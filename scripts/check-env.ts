import * as dotenv from "dotenv";
dotenv.config();

console.log("INFURA_API_KEY:", process.env.INFURA_API_KEY ? "Set ✅" : "Not set ❌");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "Set ✅" : "Not set ❌");
console.log("ETHERSCAN_API_KEY:", process.env.ETHERSCAN_API_KEY ? "Set ✅" : "Not set ❌");