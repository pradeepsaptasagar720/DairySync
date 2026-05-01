import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.model.js';
import Animal from '../models/Animal.model.js';
import MilkEntry from '../models/MilkEntry.model.js';
import Delivery from '../models/Delivery.model.js';
import Loan from '../models/Loan.model.js';
import FeedStock from '../models/FeedStock.model.js';
import DairyInfo from '../models/DairyInfo.model.js';

/**
 * Property-Based Test for Landing Statistics API
 * 
 * Property 1: Real-time Data Consistency
 * For any landing page load, all displayed statistics should accurately reflect 
 * the current database state and be consistent across all sections.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

describe('Landing Statistics API - Property Tests', () => {
  let testData = {};

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Animal.deleteMany({});
    await MilkEntry.deleteMany({});
    await Delivery.deleteMany({});
    await Loan.deleteMany({});
    await FeedStock.deleteMany({});
    await DairyInfo.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Animal.deleteMany({});
    await MilkEntry.deleteMany({});
    await Delivery.deleteMany({});
    await Loan.deleteMany({});
    await FeedStock.deleteMany({});
    await DairyInfo.deleteMany({});
  });

  const generateRandomUsers = (count) => {
    const roles = ['farmer', 'buyer', 'employee'];
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      users.push({
        username: `user_${i}_${Date.now()}`,
        email: `user${i}@test.com`,
        mobile: `98765${String(i).padStart(5, '0')}`,
        password: 'hashedpassword',
        role,
        approved: Math.random() > 0.2, // 80% approved
        isVerified: true,
        isActive: role === 'employee' ? Math.random() > 0.1 : true // 90% active employees
      });
    }
    
    return users;
  };

  const generateRandomAnimals = (farmerIds, count) => {
    const types = ['cow', 'buffalo'];
    const healthStatuses = ['healthy', 'sick', 'pregnant', 'dry'];
    const animals = [];
    
    for (let i = 0; i < count; i++) {
      animals.push({
        farmer: farmerIds[Math.floor(Math.random() * farmerIds.length)],
        animalType: types[Math.floor(Math.random() * types.length)],
        healthStatus: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
        milkCapacity: Math.floor(Math.random() * 20) + 5, // 5-25 liters
        isActive: Math.random() > 0.1 // 90% active
      });
    }
    
    return animals;
  };

  const generateRandomMilkEntries = (farmerIds, count) => {
    const entries = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
      const entryDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const cowQuantity = Math.random() * 15;
      const buffaloQuantity = Math.random() * 12;
      
      entries.push({
        farmer: farmerIds[Math.floor(Math.random() * farmerIds.length)],
        date: entryDate.toISOString().split('T')[0],
        cow: {
          quantity: cowQuantity,
          fat: Math.random() * 2 + 3 // 3-5% fat
        },
        buffalo: {
          quantity: buffaloQuantity,
          fat: Math.random() * 2 + 4 // 4-6% fat
        },
        totalAmount: (cowQuantity * 50) + (buffaloQuantity * 60), // Estimated rates
        session: Math.random() > 0.5 ? 'morning' : 'evening'
      });
    }
    
    return entries;
  };

  it('Property 1: Real-time Data Consistency - User statistics match database state', async () => {
    // Generate random test data
    const userCount = Math.floor(Math.random() * 50) + 10; // 10-60 users
    const users = generateRandomUsers(userCount);
    
    // Insert test data
    const insertedUsers = await User.insertMany(users);
    
    // Count expected values
    const expectedFarmers = insertedUsers.filter(u => u.role === 'farmer' && u.approved).length;
    const expectedBuyers = insertedUsers.filter(u => u.role === 'buyer' && u.approved).length;
    const expectedEmployees = insertedUsers.filter(u => u.role === 'employee' && u.approved && u.isActive).length;
    const expectedTotal = expectedFarmers + expectedBuyers + expectedEmployees;
    
    // Call API
    const response = await request(app)
      .get('/api/public/landing-stats')
      .expect(200);
    
    const { data } = response.body;
    
    // Verify user statistics consistency
    expect(data.users.farmers.total).toBe(expectedFarmers);
    expect(data.users.buyers.total).toBe(expectedBuyers);
    expect(data.users.employees.total).toBe(expectedEmployees);
    expect(data.users.total).toBe(expectedTotal);
    
    // Verify internal consistency
    expect(data.users.total).toBe(
      data.users.farmers.total + data.users.buyers.total + data.users.employees.total
    );
  });

  it('Property 1: Real-time Data Consistency - Animal statistics reflect database state', async () => {
    // Create farmers first
    const farmers = await User.insertMany(generateRandomUsers(10).map(u => ({ ...u, role: 'farmer', approved: true })));
    const farmerIds = farmers.map(f => f._id);
    
    // Generate random animals
    const animalCount = Math.floor(Math.random() * 100) + 20; // 20-120 animals
    const animals = generateRandomAnimals(farmerIds, animalCount);
    
    // Insert animals
    await Animal.insertMany(animals);
    
    // Count expected values
    const expectedCows = animals.filter(a => a.animalType === 'cow').length;
    const expectedBuffaloes = animals.filter(a => a.animalType === 'buffalo').length;
    const expectedTotal = expectedCows + expectedBuffaloes;
    
    const healthCounts = animals.reduce((acc, animal) => {
      acc[animal.healthStatus] = (acc[animal.healthStatus] || 0) + 1;
      return acc;
    }, {});
    
    // Call API
    const response = await request(app)
      .get('/api/public/landing-stats')
      .expect(200);
    
    const { data } = response.body;
    
    // Verify animal statistics consistency
    expect(data.animals.cows).toBe(expectedCows);
    expect(data.animals.buffaloes).toBe(expectedBuffaloes);
    expect(data.animals.total).toBe(expectedTotal);
    
    // Verify health statistics
    expect(data.animals.health.healthy).toBe(healthCounts.healthy || 0);
    expect(data.animals.health.sick).toBe(healthCounts.sick || 0);
    expect(data.animals.health.pregnant).toBe(healthCounts.pregnant || 0);
    expect(data.animals.health.dry).toBe(healthCounts.dry || 0);
    
    // Verify internal consistency
    expect(data.animals.total).toBe(data.animals.cows + data.animals.buffaloes);
    
    const totalHealthAnimals = Object.values(data.animals.health).reduce((sum, count) => sum + count, 0);
    expect(totalHealthAnimals).toBe(expectedTotal);
  });

  it('Property 1: Real-time Data Consistency - Milk collection statistics are accurate', async () => {
    // Create farmers
    const farmers = await User.insertMany(generateRandomUsers(5).map(u => ({ ...u, role: 'farmer', approved: true })));
    const farmerIds = farmers.map(f => f._id);
    
    // Generate milk entries for current month
    const entryCount = Math.floor(Math.random() * 50) + 10; // 10-60 entries
    const milkEntries = generateRandomMilkEntries(farmerIds, entryCount);
    
    // Filter entries for current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const currentMonthEntries = milkEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfMonth && entryDate <= endOfMonth;
    });
    
    // Insert milk entries
    await MilkEntry.insertMany(milkEntries);
    
    // Calculate expected values
    const expectedTotalLiters = currentMonthEntries.reduce((sum, entry) => 
      sum + entry.cow.quantity + entry.buffalo.quantity, 0
    );
    const expectedTotalAmount = currentMonthEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
    const expectedEntryCount = currentMonthEntries.length;
    
    // Call API
    const response = await request(app)
      .get('/api/public/landing-stats')
      .expect(200);
    
    const { data } = response.body;
    
    // Verify milk collection consistency (with tolerance for floating point precision)
    expect(Math.abs(data.milkCollection.monthly.total.liters - expectedTotalLiters)).toBeLessThan(0.01);
    expect(Math.abs(data.milkCollection.monthly.total.amount - expectedTotalAmount)).toBeLessThan(0.01);
    expect(data.milkCollection.monthly.total.entries).toBe(expectedEntryCount);
    
    // Verify internal consistency
    expect(Math.abs(
      data.milkCollection.monthly.total.liters - 
      (data.milkCollection.monthly.cow.liters + data.milkCollection.monthly.buffalo.liters)
    )).toBeLessThan(0.01);
    
    expect(Math.abs(
      data.milkCollection.monthly.total.amount - 
      (data.milkCollection.monthly.cow.amount + data.milkCollection.monthly.buffalo.amount)
    )).toBeLessThan(0.01);
  });

  it('Property 1: Real-time Data Consistency - Revenue calculations are correct', async () => {
    // Create test data
    const farmers = await User.insertMany(generateRandomUsers(3).map(u => ({ ...u, role: 'farmer', approved: true })));
    const buyers = await User.insertMany(generateRandomUsers(2).map(u => ({ ...u, role: 'buyer', approved: true })));
    
    const farmerIds = farmers.map(f => f._id);
    const buyerIds = buyers.map(b => b._id);
    
    // Create milk entries
    const milkEntries = generateRandomMilkEntries(farmerIds, 10);
    await MilkEntry.insertMany(milkEntries);
    
    // Create deliveries for current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const deliveries = [];
    for (let i = 0; i < 5; i++) {
      const deliveryDate = new Date(startOfMonth.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      deliveries.push({
        buyer: buyerIds[Math.floor(Math.random() * buyerIds.length)],
        quantity: Math.random() * 10 + 5,
        totalAmount: Math.random() * 500 + 200,
        status: ['Completed', 'Delivered'][Math.floor(Math.random() * 2)],
        createdAt: deliveryDate,
        deliveryDate: deliveryDate
      });
    }
    
    await Delivery.insertMany(deliveries);
    
    // Call API
    const response = await request(app)
      .get('/api/public/landing-stats')
      .expect(200);
    
    const { data } = response.body;
    
    // Verify revenue consistency
    const expectedMonthlyRevenue = data.revenue.milkSales + data.revenue.deliveryRevenue;
    expect(Math.abs(data.revenue.monthly - expectedMonthlyRevenue)).toBeLessThan(0.01);
    
    // Verify revenue breakdown percentages
    if (data.revenue.monthly > 0) {
      const milkPercentage = data.revenue.breakdown.milkCollection;
      const deliveryPercentage = data.revenue.breakdown.deliveries;
      
      expect(Math.abs(milkPercentage + deliveryPercentage - 100)).toBeLessThan(0.1);
      expect(milkPercentage).toBeGreaterThanOrEqual(0);
      expect(deliveryPercentage).toBeGreaterThanOrEqual(0);
    }
  });

  it('Property 1: Real-time Data Consistency - System metrics are valid', async () => {
    // Call API multiple times to test consistency
    const responses = await Promise.all([
      request(app).get('/api/public/landing-stats'),
      request(app).get('/api/public/landing-stats'),
      request(app).get('/api/public/landing-stats')
    ]);
    
    // All responses should be successful
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    const [response1, response2, response3] = responses.map(r => r.body.data);
    
    // System metrics should be consistent across calls (within reasonable bounds)
    expect(response1.system.uptime).toBeGreaterThanOrEqual(0);
    expect(response2.system.uptime).toBeGreaterThanOrEqual(response1.system.uptime);
    expect(response3.system.uptime).toBeGreaterThanOrEqual(response2.system.uptime);
    
    // Performance metrics should be valid
    [response1, response2, response3].forEach(data => {
      expect(data.system.performance.memoryUsage).toBeGreaterThan(0);
      expect(data.system.performance.availability).toMatch(/^\d+(\.\d+)?%$/);
      expect(data.system.performance.responseTime).toMatch(/^< \d+ms$/);
    });
  });

  it('Property 1: Real-time Data Consistency - Feature adoption rates are logical', async () => {
    // Create varied test data
    const users = generateRandomUsers(20);
    await User.insertMany(users);
    
    // Call API
    const response = await request(app)
      .get('/api/public/landing-stats')
      .expect(200);
    
    const { data } = response.body;
    
    // Verify feature adoption rates are within valid ranges
    Object.values(data.features).forEach(feature => {
      if (typeof feature === 'object' && feature.adoption !== undefined) {
        expect(feature.adoption).toBeGreaterThanOrEqual(0);
        expect(feature.adoption).toBeLessThanOrEqual(100);
      }
    });
    
    // Verify efficiency metrics are reasonable
    expect(data.efficiency.collectionEfficiency).toBeGreaterThanOrEqual(0);
    expect(data.efficiency.collectionEfficiency).toBeLessThanOrEqual(100);
    expect(data.efficiency.deliveryEfficiency).toBeGreaterThanOrEqual(0);
    expect(data.efficiency.deliveryEfficiency).toBeLessThanOrEqual(100);
    expect(data.efficiency.systemUtilization).toBeGreaterThanOrEqual(0);
    expect(data.efficiency.systemUtilization).toBeLessThanOrEqual(100);
    
    // User satisfaction should be between 1-5
    expect(data.efficiency.userSatisfaction).toBeGreaterThanOrEqual(1);
    expect(data.efficiency.userSatisfaction).toBeLessThanOrEqual(5);
  });
});