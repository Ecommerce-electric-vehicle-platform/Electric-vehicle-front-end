// src/api/orderApi.js
import axiosInstance from './axiosInstance';

// Get shipping partners
export const getShippingPartners = async () => {
    try {
        const response = await axiosInstance.get('/api/v1/shipping-partners');
        return response.data;
    } catch (error) {
        console.error('Error fetching shipping partners:', error);
        throw error;
    }
};

// Get payment methods for user
export const getPaymentMethods = async () => {
    try {
        const response = await axiosInstance.get('/api/v1/payment-methods');
        return response.data;
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
    }
};

// Get user's e-wallet balance
export const getWalletBalance = async () => {
    try {
        const response = await axiosInstance.get('/api/v1/wallet/balance');
        return response.data;
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        throw error;
    }
};

// Place order
export const placeOrder = async (orderData) => {
    try {
        const response = await axiosInstance.post('/api/v1/buyer/place-order', orderData);
        return response.data;
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    }
};

// Get order details
export const getOrderDetails = async (orderId) => {
    try {
        const response = await axiosInstance.get(`/api/v1/orders/${orderId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
};

// Get user's orders
export const getUserOrders = async (page = 1, limit = 10) => {
    try {
        const response = await axiosInstance.get(`/api/v1/orders?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user orders:', error);
        throw error;
    }
};
