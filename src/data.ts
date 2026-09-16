import { FoodItem, GuestCustomer, MemberCustomer, Coupon } from "./types.js";

export const foodItems: FoodItem[] = [
  {
    id: 1,
    name: "Margherita Pizza",
    category: "pizza",
    price: 299,
    isAvailable: true,
  },
  {
    id: 2,
    name: "Farmhouse Loaded Pizza",
    category: "pizza",
    price: 499,
    isAvailable: true,
  },
  {
    id: 3,
    name: "Classic Veg Cheese Burger",
    category: "burger",
    price: 149,
    isAvailable: true,
  },
  {
    id: 4,
    name: "Double Crispy Paneer Burger",
    category: "burger",
    price: 249,
    isAvailable: true,
  },
  {
    id: 5,
    name: "Choco Lava Cake",
    category: "dessert",
    price: 129,
    isAvailable: true,
  },
  {
    id: 6,
    name: "Sizzling Brownie with Ice Cream",
    category: "dessert",
    price: 199,
    isAvailable: true,
  },
  {
    id: 7,
    name: "Iced Cold Coffee",
    category: "drink",
    price: 120,
    isAvailable: true,
  },
  {
    id: 8,
    name: "Fresh Mango Smoothie",
    category: "drink",
    price: 160,
    isAvailable: true,
  },
  {
    id: 9,
    name: "BBQ Pepperoni Pizza",
    category: "pizza",
    price: 599,
    isAvailable: false,
  },
  {
    id: 10,
    name: "Sparkling Lemon Mint Mojito",
    category: "drink",
    price: 110,
    isAvailable: true,
  },
];

export const sampleGuest: GuestCustomer = {
  id: 101,
  name: "Rahul Sharma",
  phone: "9876543210",
  address: "123 Green Park, Sector 15, New Delhi",
  type: "guest",
};

export const sampleMembers: MemberCustomer[] = [
  {
    id: 201,
    name: "Priya Patel",
    phone: "9812345678",
    address: {
      street: "45 MG Road, Block C",
      city: "Bengaluru",
      pincode: "560001",
    },
    type: "member",
    membershipId: "MEM-SILVER-01",
    discountPercentage: 5,
    membershipLevel: "silver",
  },
  {
    id: 202,
    name: "Amitabh Verma",
    phone: "9988776655",
    address: "78 Park Street, Kolkata",
    type: "member",
    membershipId: "MEM-GOLD-02",
    discountPercentage: 10,
    membershipLevel: "gold",
  },
  {
    id: 203,
    name: "Sneha Reddy",
    phone: "9765432109",
    address: "12 Jubilee Hills, Hyderabad",
    type: "member",
    membershipId: "MEM-PLAT-03",
    discountPercentage: 15,
    membershipLevel: "platinum",
  },
];

export const availableCoupons: Coupon[] = [
  {
    code: "WELCOME100",
    description: "Flat ₹100 discount on orders above ₹500",
    discountPercentage: 0,
    maxDiscount: 100,
    minOrderAmount: 500,
  },
  {
    code: "FEAST15",
    description: "15% discount on orders above ₹1000 (Max ₹300)",
    discountPercentage: 15,
    maxDiscount: 300,
    minOrderAmount: 1000,
  },
  {
    code: "SUPER50",
    description: "Flat 10% discount with no minimum order",
    discountPercentage: 10,
    maxDiscount: 150,
    minOrderAmount: 0,
  },
];
