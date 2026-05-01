import mongoose from "mongoose";
import Loan from "../models/Loan.model.js";
import User from "../models/User.model.js";
import { env } from "../config/env.js";

await mongoose.connect(env.MONGO_URI);

// Get some farmers and the loan manager
const farmers = await User.find({ role: "farmer" }).limit(5);
const loanManager = await User.findOne({ employeeRole: "loan_feed_manager" });

if (!loanManager) {
  console.log("❌ No loan manager found. Please run employee seed first.");
  process.exit(1);
}

if (farmers.length === 0) {
  console.log("❌ No farmers found. Please create some farmers first.");
  process.exit(1);
}

// Clear existing loans to start fresh
await Loan.deleteMany({});
console.log("🧹 Cleared existing loans");

const sampleLoans = [
  {
    farmer: farmers[0]._id,
    requestedAmount: 50000,
    purpose: "Purchase of dairy cattle",
    status: "requested"
  },
  {
    farmer: farmers[1]._id,
    requestedAmount: 25000,
    purpose: "Feed and fodder purchase",
    status: "requested"
  },
  {
    farmer: farmers[2]._id,
    requestedAmount: 75000,
    purpose: "Farm equipment purchase",
    status: "approved",
    approvedAmount: 70000,
    approvalDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    approvedBy: loanManager._id,
    totalDue: 70000
  },
  {
    farmer: farmers[3]._id,
    requestedAmount: 30000,
    purpose: "Veterinary expenses",
    status: "partially_paid",
    approvedAmount: 30000,
    approvalDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    approvedBy: loanManager._id,
    totalReturned: 10000,
    totalDue: 20000
  }
];

// Add more loans if we have more farmers
if (farmers.length > 4) {
  sampleLoans.push({
    farmer: farmers[4]._id,
    requestedAmount: 40000,
    purpose: "Milk processing equipment",
    status: "fully_cleared",
    approvedAmount: 40000,
    approvalDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    approvedBy: loanManager._id,
    totalReturned: 40000,
    totalDue: 0,
    clearanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    clearedBy: loanManager._id
  });
}

for (const loanData of sampleLoans) {
  const loan = await Loan.create(loanData);
  
  // Add history entries for approved loans
  if (loan.status !== 'requested') {
    // Add approval history
    loan.history.push({
      transactionType: 'loan_approved',
      previousDue: 0,
      transactionAmount: loan.approvedAmount,
      currentDue: loan.approvedAmount,
      processedBy: loanManager._id,
      date: loan.approvalDate,
      notes: `Loan approved for ₹${loan.approvedAmount.toLocaleString()}`
    });

    // Add payment history for partially paid and fully cleared loans
    if (loan.totalReturned > 0) {
      const paymentDate = new Date(loan.approvalDate.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days after approval
      
      if (loan.status === 'partially_paid') {
        loan.history.push({
          transactionType: 'partial_payment',
          previousDue: loan.approvedAmount,
          transactionAmount: -loan.totalReturned,
          currentDue: loan.totalDue,
          paymentMode: 'cash',
          processedBy: loanManager._id,
          date: paymentDate,
          notes: `Partial payment of ₹${loan.totalReturned.toLocaleString()} received`
        });
      } else if (loan.status === 'fully_cleared') {
        // Add multiple payment entries for fully cleared loan
        const firstPayment = 20000;
        const secondPayment = loan.totalReturned - firstPayment;
        
        loan.history.push({
          transactionType: 'partial_payment',
          previousDue: loan.approvedAmount,
          transactionAmount: -firstPayment,
          currentDue: loan.approvedAmount - firstPayment,
          paymentMode: 'bank_transfer',
          processedBy: loanManager._id,
          date: paymentDate,
          notes: `First payment of ₹${firstPayment.toLocaleString()} received`
        });

        const secondPaymentDate = new Date(paymentDate.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days later
        loan.history.push({
          transactionType: 'full_payment',
          previousDue: loan.approvedAmount - firstPayment,
          transactionAmount: -secondPayment,
          currentDue: 0,
          paymentMode: 'upi',
          processedBy: loanManager._id,
          date: secondPaymentDate,
          notes: `Final payment of ₹${secondPayment.toLocaleString()} received - loan fully paid`
        });

        // Add clearance history
        loan.history.push({
          transactionType: 'loan_cleared',
          previousDue: 0,
          transactionAmount: 0,
          currentDue: 0,
          processedBy: loanManager._id,
          date: loan.clearanceDate,
          notes: 'Loan cleared - all payments completed'
        });
      }
    }

    await loan.save();
  }
  
  const farmer = await User.findById(loanData.farmer);
  console.log(`✅ Created loan for ${farmer.username}: ₹${loanData.requestedAmount.toLocaleString()} (${loanData.status})`);
}

console.log("\n🎉 Loan seeding completed!");
console.log("\nSample Loans Created:");
console.log("- Requested loans awaiting approval");
console.log("- Approved loans ready for payments");
console.log("- Partially paid loans with payment history");
console.log("- Fully cleared loans with complete transaction history");
console.log("- Different loan purposes and amounts");

process.exit();