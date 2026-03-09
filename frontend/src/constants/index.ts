import type { ProductCategory, Product, UserRole, SubRole } from '@/types';

// Product Categories with Display Names
export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: 'fruits', label: 'Fruits', icon: 'Apple' },
  { value: 'vegetables', label: 'Vegetables', icon: 'Carrot' },
  { value: 'meat', label: 'Meat', icon: 'Beef' },
  { value: 'dairy', label: 'Dairy', icon: 'Milk' },
  { value: 'grains', label: 'Grains', icon: 'Wheat' },
  { value: 'spices', label: 'Spices', icon: 'Flame' },
];

// User Roles with Display Names
export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'kitchen', label: 'Kitchen', description: 'Restaurants and food preparation centers' },
  { value: 'supplier', label: 'Supplier', description: 'Supply chain coordinators and distributors' },
  { value: 'vendor', label: 'Vendor', description: 'Product sellers and category specialists' },
  { value: 'transporter', label: 'Transporter', description: 'Delivery and logistics providers' },
];

// Sub-roles mapping
export const SUB_ROLES: Record<UserRole, { value: SubRole; label: string }[]> = {
  admin: [],
  kitchen: [
    { value: 'chef', label: 'Chef' },
    { value: 'restaurant_manager', label: 'Restaurant Manager' },
  ],
  supplier: [],
  vendor: [
    { value: 'veggies_vendor', label: 'Vegetables Vendor' },
    { value: 'fruit_vendor', label: 'Fruit Vendor' },
    { value: 'butcher', label: 'Butcher' },
    { value: 'dairy_vendor', label: 'Dairy Vendor' },
  ],
  transporter: [
    { value: 'driver', label: 'Driver' },
    { value: 'delivery_agent', label: 'Delivery Agent' },
  ],
};

// Category to Sub-role mapping for vendor matching
export const CATEGORY_TO_VENDOR_SUBROLE: Record<ProductCategory, SubRole[]> = {
  fruits: ['fruit_vendor'],
  vegetables: ['veggies_vendor'],
  meat: ['butcher'],
  dairy: ['dairy_vendor'],
  grains: ['veggies_vendor'],
  spices: ['veggies_vendor'],
};

// Predefined Inventory Products
export const INVENTORY_PRODUCTS: Product[] = [
  // Fruits
  { id: 'f1', name: 'Apple', category: 'fruits', unit: 'kg', basePrice: 120, description: 'Fresh red apples', isActive: true },
  { id: 'f2', name: 'Banana', category: 'fruits', unit: 'dozen', basePrice: 60, description: 'Ripe yellow bananas', isActive: true },
  { id: 'f3', name: 'Orange', category: 'fruits', unit: 'kg', basePrice: 100, description: 'Juicy oranges', isActive: true },
  { id: 'f4', name: 'Mango', category: 'fruits', unit: 'kg', basePrice: 200, description: 'Sweet mangoes', isActive: true },
  { id: 'f5', name: 'Grapes', category: 'fruits', unit: 'kg', basePrice: 180, description: 'Fresh grapes', isActive: true },
  { id: 'f6', name: 'Watermelon', category: 'fruits', unit: 'piece', basePrice: 150, description: 'Sweet watermelon', isActive: true },
  
  // Vegetables
  { id: 'v1', name: 'Tomato', category: 'vegetables', unit: 'kg', basePrice: 40, description: 'Fresh tomatoes', isActive: true },
  { id: 'v2', name: 'Onion', category: 'vegetables', unit: 'kg', basePrice: 35, description: 'Red onions', isActive: true },
  { id: 'v3', name: 'Potato', category: 'vegetables', unit: 'kg', basePrice: 30, description: 'Fresh potatoes', isActive: true },
  { id: 'v4', name: 'Carrot', category: 'vegetables', unit: 'kg', basePrice: 45, description: 'Orange carrots', isActive: true },
  { id: 'v5', name: 'Cabbage', category: 'vegetables', unit: 'piece', basePrice: 25, description: 'Fresh cabbage', isActive: true },
  { id: 'v6', name: 'Cauliflower', category: 'vegetables', unit: 'piece', basePrice: 35, description: 'Fresh cauliflower', isActive: true },
  { id: 'v7', name: 'Spinach', category: 'vegetables', unit: 'bunch', basePrice: 20, description: 'Fresh spinach', isActive: true },
  { id: 'v8', name: 'Bell Pepper', category: 'vegetables', unit: 'kg', basePrice: 80, description: 'Colorful bell peppers', isActive: true },
  
  // Meat
  { id: 'm1', name: 'Chicken Breast', category: 'meat', unit: 'kg', basePrice: 280, description: 'Boneless chicken breast', isActive: true },
  { id: 'm2', name: 'Chicken Whole', category: 'meat', unit: 'kg', basePrice: 220, description: 'Whole chicken', isActive: true },
  { id: 'm3', name: 'Mutton', category: 'meat', unit: 'kg', basePrice: 650, description: 'Fresh mutton', isActive: true },
  { id: 'm4', name: 'Fish', category: 'meat', unit: 'kg', basePrice: 350, description: 'Fresh fish', isActive: true },
  { id: 'm5', name: 'Eggs', category: 'meat', unit: 'dozen', basePrice: 90, description: 'Fresh eggs', isActive: true },
  
  // Dairy
  { id: 'd1', name: 'Milk', category: 'dairy', unit: 'liter', basePrice: 60, description: 'Fresh milk', isActive: true },
  { id: 'd2', name: 'Butter', category: 'dairy', unit: '500g', basePrice: 250, description: 'Creamy butter', isActive: true },
  { id: 'd3', name: 'Cheese', category: 'dairy', unit: '200g', basePrice: 180, description: 'Processed cheese', isActive: true },
  { id: 'd4', name: 'Yogurt', category: 'dairy', unit: '500g', basePrice: 70, description: 'Fresh yogurt', isActive: true },
  { id: 'd5', name: 'Cream', category: 'dairy', unit: '250ml', basePrice: 120, description: 'Fresh cream', isActive: true },
  { id: 'd6', name: 'Paneer', category: 'dairy', unit: '200g', basePrice: 150, description: 'Fresh paneer', isActive: true },
  
  // Grains
  { id: 'g1', name: 'Rice', category: 'grains', unit: 'kg', basePrice: 80, description: 'Basmati rice', isActive: true },
  { id: 'g2', name: 'Wheat Flour', category: 'grains', unit: 'kg', basePrice: 45, description: 'Whole wheat flour', isActive: true },
  { id: 'g3', name: 'Lentils', category: 'grains', unit: 'kg', basePrice: 120, description: 'Mixed lentils', isActive: true },
  
  // Spices
  { id: 's1', name: 'Turmeric', category: 'spices', unit: '100g', basePrice: 35, description: 'Turmeric powder', isActive: true },
  { id: 's2', name: 'Cumin', category: 'spices', unit: '100g', basePrice: 45, description: 'Cumin seeds', isActive: true },
  { id: 's3', name: 'Coriander', category: 'spices', unit: '100g', basePrice: 30, description: 'Coriander powder', isActive: true },
  { id: 's4', name: 'Garam Masala', category: 'spices', unit: '100g', basePrice: 55, description: 'Mixed spices', isActive: true },
  { id: 's5', name: 'Red Chili', category: 'spices', unit: '100g', basePrice: 40, description: 'Red chili powder', isActive: true },
];

// Order Status Display Mapping
export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  pending_supplier: { label: 'Pending Supplier', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  vendor_assigned: { label: 'Vendor Assigned', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  packing: { label: 'Packing', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  packed_ready: { label: 'Packed & Ready', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  pickup_requested: { label: 'Pickup Requested', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  in_transit: { label: 'In Transit', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  delivered: { label: 'Delivered', color: 'text-green-600', bgColor: 'bg-green-100' },
  kitchen_confirmed: { label: 'Kitchen Confirmed', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Tax Rate
export const TAX_RATE = 0.18; // 18% GST

// Currency
export const CURRENCY = '₹';

// Demo Users for Testing
export const DEMO_USERS = [
  { email: 'admin@supplychain.com', password: 'admin123', role: 'admin' as UserRole, name: 'Admin User' },
  { email: 'kitchen@supplychain.com', password: 'kitchen123', role: 'kitchen' as UserRole, name: 'Kitchen Manager', subRole: 'restaurant_manager' },
  { email: 'supplier@supplychain.com', password: 'supplier123', role: 'supplier' as UserRole, name: 'Supplier Manager' },
  { email: 'vendor@supplychain.com', password: 'vendor123', role: 'vendor' as UserRole, name: 'Vendor Manager', subRole: 'veggies_vendor' },
  { email: 'transporter@supplychain.com', password: 'transporter123', role: 'transporter' as UserRole, name: 'Driver', subRole: 'driver' },
];
