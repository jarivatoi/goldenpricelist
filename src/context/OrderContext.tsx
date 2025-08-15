import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderCategory, OrderItemTemplate, Order, OrderItem } from '../types';

/**
 * ORDER CONTEXT TYPE DEFINITION
 * =============================
 */
interface OrderContextType {
  // Categories
  categories: OrderCategory[];
  addCategory: (name: string) => Promise<OrderCategory>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Item Templates
  itemTemplates: OrderItemTemplate[];
  getItemTemplatesByCategory: (categoryId: string) => OrderItemTemplate[];
  addItemTemplate: (categoryId: string, name: string, unitPrice: number) => Promise<OrderItemTemplate>;
  updateItemTemplate: (id: string, name: string, unitPrice: number) => Promise<void>;
  deleteItemTemplate: (id: string) => Promise<void>;
  
  // Orders
  orders: Order[];
  getOrdersByCategory: (categoryId: string) => Order[];
  addOrder: (categoryId: string, orderDate: Date, items: OrderItem[]) => Promise<Order>;
  updateOrder: (id: string, orderDate: Date, items: OrderItem[]) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  
  // Utility
  searchCategories: (query: string) => OrderCategory[];
  
  // State
  isLoading: boolean;
  error: string | null;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

/**
 * CUSTOM HOOK FOR ORDER CONTEXT ACCESS
 * ====================================
 */
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

/**
 * FORMAT NAME UTILITY
 * ===================
 */
const formatName = (name: string): string => {
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * ORDER PROVIDER COMPONENT
 * ========================
 */
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  // State management
  const [categories, setCategories] = useState<OrderCategory[]>([]);
  const [itemTemplates, setItemTemplates] = useState<OrderItemTemplate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with empty state
  useEffect(() => {
    // Initialize with empty state - no database operations
    setIsLoading(false);
  }, []);

  // Category management
  const addCategory = async (name: string, vatPercentage: number = 15): Promise<OrderCategory> => {

    const formattedName = formatName(name);
    
    // Check for duplicates
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === formattedName.toLowerCase()
    );
    
    if (existingCategory) {
      throw new Error(`Category "${formattedName}" already exists`);
    }
    
    const newCategory: OrderCategory = {
      id: crypto.randomUUID(),
      name: formattedName,
      vatPercentage,
      createdAt: new Date()
    };
    
    // Add to local state
    setCategories(prev => [...prev, newCategory]);
    
    return newCategory;
  };

  const updateCategory = async (id: string, name: string, vatPercentage: number): Promise<void> => {

    const formattedName = formatName(name);
    
    // Update in local state
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, name: formattedName, vatPercentage } : cat
    ));
  };

  const deleteCategory = async (id: string): Promise<void> => {

    // Remove from local state
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Also remove related templates and orders
    setItemTemplates(prev => prev.filter(temp => temp.categoryId !== id));
    setOrders(prev => prev.filter(order => order.categoryId !== id));
  };

  // Item Template management
  const getItemTemplatesByCategory = (categoryId: string): OrderItemTemplate[] => {
    return itemTemplates.filter(temp => temp.categoryId === categoryId);
  };

  const addItemTemplate = async (categoryId: string, name: string, unitPrice: number, isVatNil: boolean = false): Promise<OrderItemTemplate> => {
    const formattedName = formatName(name);
    
    // Get category's VAT percentage
    const category = categories.find(c => c.id === categoryId);
    const categoryVatPercentage = category?.vatPercentage || 15;
    
    // Check for duplicates within category
    const existingTemplate = itemTemplates.find(temp => 
      temp.categoryId === categoryId && 
      temp.name.toLowerCase() === formattedName.toLowerCase()
    );
    
    if (existingTemplate) {
      throw new Error(`Item "${formattedName}" already exists in this category`);
    }
    
    const newItemTemplate: OrderItemTemplate = {
      id: crypto.randomUUID(),
      categoryId,
      name: formattedName,
      unitPrice,
      isVatNil,
      vatPercentage: categoryVatPercentage,
      createdAt: new Date()
    };
    
    setItemTemplates(prev => [...prev, newItemTemplate]);
    return newItemTemplate;
  };

  const updateItemTemplate = async (id: string, name: string, unitPrice: number, isVatNil: boolean): Promise<void> => {
    const formattedName = formatName(name);
    setItemTemplates(prev => prev.map(temp => 
      temp.id === id ? { ...temp, name: formattedName, unitPrice, isVatNil } : temp
    ));
  };

  const deleteItemTemplate = async (id: string): Promise<void> => {
    setItemTemplates(prev => prev.filter(temp => temp.id !== id));
    // Also remove any order items using this template
    setOrders(prev => prev.map(order => ({
      ...order,
      items: order.items.filter(item => item.templateId !== id),
      totalCost: order.items
        .filter(item => item.templateId !== id)
        .filter(item => item.isAvailable)
        .reduce((sum, item) => sum + item.totalPrice, 0)
    })));
  };

  // Order management
  const getOrdersByCategory = (categoryId: string): Order[] => {
    return orders.filter(order => order.categoryId === categoryId)
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  };

  const addOrder = async (categoryId: string, orderDate: Date, items: OrderItem[]): Promise<Order> => {
    const totalCost = items
      .filter(item => item.isAvailable)
      .reduce((sum, item) => sum + item.totalPrice, 0);
    
    const newOrder: Order = {
      id: crypto.randomUUID(),
      categoryId,
      orderDate,
      items,
      totalCost,
      createdAt: new Date()
    };
    
    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  const updateOrder = async (id: string, orderDate: Date, items: OrderItem[]): Promise<void> => {
    const totalCost = items
      .filter(item => item.isAvailable)
      .reduce((sum, item) => sum + item.totalPrice, 0);
    
    setOrders(prev => prev.map(order => 
      order.id === id ? { 
        ...order, 
        orderDate, 
        items, 
        totalCost,
        lastEditedAt: new Date()
      } : order
    ));
  };

  const deleteOrder = async (id: string): Promise<void> => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  // Search categories
  const searchCategories = (query: string): OrderCategory[] => {
    if (!query.trim()) return categories;
    
    const lowerQuery = query.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(lowerQuery)
    );
  };

  const value = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    itemTemplates,
    getItemTemplatesByCategory,
    addItemTemplate,
    updateItemTemplate,
    deleteItemTemplate,
    orders,
    getOrdersByCategory,
    addOrder,
    updateOrder,
    deleteOrder,
    searchCategories,
    isLoading,
    error
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};