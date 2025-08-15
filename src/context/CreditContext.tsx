import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Client, Transaction, Payment } from '../types';

interface CreditContextType {
  clients: Client[];
  transactions: Transaction[];
  payments: Payment[];
  loading: boolean;
  error: string | null;
  
  // Client operations
  addClient: (id: string, name: string) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  searchClients: (query: string) => Client[];
  getClientTotalDebt: (clientId: string) => number;
  getClientBottlesOwed: (clientId: string) => { beer: number; guinness: number; malta: number; coca: number; chopines: number };
  getClientTransactions: (clientId: string) => Transaction[];
  getClientPayments: (clientId: string) => Payment[];
  
  // Transaction operations
  addTransaction: (client: Client, description: string, amount: number) => Promise<void>;
  
  // Payment operations
  addPartialPayment: (clientId: string, amount: number) => Promise<void>;
  settleClient: (clientId: string) => Promise<void>;
  
  // Bottle operations
  returnBottles: (clientId: string, bottles: { beer?: number; guinness?: number; malta?: number; coca?: number; chopines?: number }) => Promise<void>;
  
  // Data management
  refreshData: () => Promise<void>;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const useCredit = () => {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return context;
};

interface CreditProviderProps {
  children: ReactNode;
}

export const CreditProvider: React.FC<CreditProviderProps> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('credit_clients')
        .select('*')
        .order('name');

      if (clientsError) throw clientsError;

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('credit_payments')
        .select('*')
        .order('date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Transform data
      const transformedClients: Client[] = (clientsData || []).map(client => ({
        id: client.id,
        name: client.name,
        totalDebt: client.total_debt || 0,
        createdAt: new Date(client.created_at),
        lastTransactionAt: new Date(client.last_transaction_at),
        bottlesOwed: typeof client.bottles_owed === 'string' 
          ? JSON.parse(client.bottles_owed)
          : client.bottles_owed || { beer: 0, guinness: 0, malta: 0, coca: 0, chopines: 0 }
      }));

      const transformedTransactions: Transaction[] = (transactionsData || []).map(transaction => ({
        id: transaction.id,
        clientId: transaction.client_id,
        description: transaction.description,
        amount: transaction.amount,
        date: new Date(transaction.date),
        type: transaction.type as 'debt' | 'payment'
      }));

      const transformedPayments: Payment[] = (paymentsData || []).map(payment => ({
        id: payment.id,
        clientId: payment.client_id,
        amount: payment.amount,
        date: new Date(payment.date),
        type: payment.type as 'partial' | 'full'
      }));

      setClients(transformedClients);
      setTransactions(transformedTransactions);
      setPayments(transformedPayments);
    } catch (err) {
      console.error('Error loading credit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Add new client
  const addClient = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('credit_clients')
        .insert({
          id,
          name,
          total_debt: 0,
          bottles_owed: JSON.stringify({ beer: 0, guinness: 0, malta: 0, coca: 0, chopines: 0 })
        });

      if (error) throw error;

      const newClient: Client = {
        id,
        name,
        totalDebt: 0,
        createdAt: new Date(),
        lastTransactionAt: new Date(),
        bottlesOwed: { beer: 0, guinness: 0, malta: 0, coca: 0, chopines: 0 }
      };

      setClients(prev => [...prev, newClient]);
    } catch (err) {
      console.error('Error adding client:', err);
      throw err;
    }
  };

  // Delete client
  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('credit_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== clientId));
      setTransactions(prev => prev.filter(transaction => transaction.clientId !== clientId));
      setPayments(prev => prev.filter(payment => payment.clientId !== clientId));
    } catch (err) {
      console.error('Error deleting client:', err);
      throw err;
    }
  };

  // Search clients
  const searchClients = (query: string): Client[] => {
    if (!query.trim()) return clients;
    
    const lowercaseQuery = query.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(lowercaseQuery) ||
      client.id.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Get client total debt
  const getClientTotalDebt = (clientId: string): number => {
    const client = clients.find(c => c.id === clientId);
    return client?.totalDebt || 0;
  };

  // Get client bottles owed
  const getClientBottlesOwed = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.bottlesOwed || { beer: 0, guinness: 0, malta: 0, coca: 0, chopines: 0 };
  };

  // Get client transactions
  const getClientTransactions = (clientId: string): Transaction[] => {
    return transactions.filter(transaction => transaction.clientId === clientId);
  };

  // Get client payments
  const getClientPayments = (clientId: string): Payment[] => {
    return payments.filter(payment => payment.clientId === clientId);
  };

  // Add transaction
  const addTransaction = async (client: Client, description: string, amount: number) => {
    try {
      // Add transaction to database
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          client_id: client.id,
          description,
          amount,
          type: 'debt'
        });

      if (transactionError) throw transactionError;

      // Parse bottles from description
      const bottleUpdates = parseBottlesFromDescription(description);
      
      // Update client's total debt and bottles owed
      const currentBottles = getClientBottlesOwed(client.id);
      const newBottles = {
        beer: currentBottles.beer + (bottleUpdates.beer || 0),
        guinness: currentBottles.guinness + (bottleUpdates.guinness || 0),
        malta: currentBottles.malta + (bottleUpdates.malta || 0),
        coca: currentBottles.coca + (bottleUpdates.coca || 0),
        chopines: currentBottles.chopines + (bottleUpdates.chopines || 0)
      };

      const { error: clientError } = await supabase
        .from('credit_clients')
        .update({
          total_debt: getClientTotalDebt(client.id) + amount,
          last_transaction_at: new Date().toISOString(),
          bottles_owed: JSON.stringify(newBottles)
        })
        .eq('id', client.id);

      if (clientError) throw clientError;

      // Refresh data
      await refreshData();
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  };

  // Parse bottles from description
  const parseBottlesFromDescription = (description: string) => {
    const bottles = { beer: 0, guinness: 0, malta: 0, coca: 0, chopines: 0 };
    const lowercaseDesc = description.toLowerCase();

    // Parse Chopine
    const chopineMatches = lowercaseDesc.match(/(\d+)\s*chopines?/g) || [];
    chopineMatches.forEach(match => {
      const quantity = parseInt(match.match(/(\d+)/)?.[1] || '0');
      bottles.chopines += quantity;
    });

    // If description contains "chopine" without number, assume 1
    if (lowercaseDesc.includes('chopine') && chopineMatches.length === 0) {
      bottles.chopines += 1;
    }

    // Parse different bottle types
    // 1.5L bottles
    const bottle15LMatches = lowercaseDesc.match(/(\d+)\s*1\.5l/g) || [];
    bottle15LMatches.forEach(match => {
      const quantity = parseInt(match.match(/(\d+)/)?.[1] || '0');
      bottles.malta += quantity; // Map 1.5L to malta
    });

    // 2L bottles  
    const bottle2LMatches = lowercaseDesc.match(/(\d+)\s*2l/g) || [];
    bottle2LMatches.forEach(match => {
      const quantity = parseInt(match.match(/(\d+)/)?.[1] || '0');
      bottles.coca += quantity; // Map 2L to coca
    });

    // 0.5L bottles
    const bottle05LMatches = lowercaseDesc.match(/(\d+)\s*0\.5l/g) || [];
    bottle05LMatches.forEach(match => {
      const quantity = parseInt(match.match(/(\d+)/)?.[1] || '0');
      bottles.guinness += quantity; // Map 0.5L to guinness
    });

    // Regular Bouteille (without size specification) - map to beer
    const bouteilleMatches = lowercaseDesc.match(/(\d+)\s*bouteilles?(?!\s*[0-9.]+l)/g) || [];
    bouteilleMatches.forEach(match => {
      const quantity = parseInt(match.match(/(\d+)/)?.[1] || '0');
      bottles.beer += quantity;
    });

    // If description contains "bouteille" without number and no size, assume 1 regular bottle
    if (lowercaseDesc.includes('bouteille') && 
        bouteilleMatches.length === 0 && 
        bottle15LMatches.length === 0 && 
        bottle2LMatches.length === 0 && 
        bottle05LMatches.length === 0) {
      bottles.beer += 1;
    }

    return bottles;
  };

  // Add partial payment
  const addPartialPayment = async (clientId: string, amount: number) => {
    try {
      // Add payment to database
      const { error: paymentError } = await supabase
        .from('credit_payments')
        .insert({
          client_id: clientId,
          amount,
          type: 'partial'
        });

      if (paymentError) throw paymentError;

      // Update client's total debt
      const currentDebt = getClientTotalDebt(clientId);
      const newDebt = Math.max(0, currentDebt - amount);

      const { error: clientError } = await supabase
        .from('credit_clients')
        .update({
          total_debt: newDebt,
          last_transaction_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (clientError) throw clientError;

      // Refresh data
      await refreshData();
    } catch (err) {
      console.error('Error adding partial payment:', err);
      throw err;
    }
  };

  // Settle client (full payment)
  const settleClient = async (clientId: string) => {
    try {
      const currentDebt = getClientTotalDebt(clientId);
      
      if (currentDebt > 0) {
        // Add full payment
        const { error: paymentError } = await supabase
          .from('credit_payments')
          .insert({
            client_id: clientId,
            amount: currentDebt,
            type: 'full'
          });

        if (paymentError) throw paymentError;
      }

      // Reset client debt and bottles
      const { error: clientError } = await supabase
        .from('credit_clients')
        .update({
          total_debt: 0,
          last_transaction_at: new Date().toISOString(),
          bottles_owed: JSON.stringify({ beer: 0, guinness: 0, malta: 0, coca: 0, chopines: 0 })
        })
        .eq('id', clientId);

      if (clientError) throw clientError;

      // Refresh data
      await refreshData();
    } catch (err) {
      console.error('Error settling client:', err);
      throw err;
    }
  };

  // Return bottles
  const returnBottles = async (clientId: string, returnedBottles: { beer?: number; guinness?: number; malta?: number; coca?: number; chopines?: number }) => {
    try {
      const currentBottles = getClientBottlesOwed(clientId);
      const newBottles = {
        beer: Math.max(0, currentBottles.beer - (returnedBottles.beer || 0)),
        guinness: Math.max(0, currentBottles.guinness - (returnedBottles.guinness || 0)),
        malta: Math.max(0, currentBottles.malta - (returnedBottles.malta || 0)),
        coca: Math.max(0, currentBottles.coca - (returnedBottles.coca || 0)),
        chopines: Math.max(0, currentBottles.chopines - (returnedBottles.chopines || 0))
      };

      const { error } = await supabase
        .from('credit_clients')
        .update({
          bottles_owed: JSON.stringify(newBottles),
          last_transaction_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      // Refresh data
      await refreshData();
    } catch (err) {
      console.error('Error returning bottles:', err);
      throw err;
    }
  };

  // Refresh data
  const refreshData = async () => {
    await loadData();
  };

  const value: CreditContextType = {
    clients,
    transactions,
    payments,
    loading,
    error,
    addClient,
    deleteClient,
    searchClients,
    getClientTotalDebt,
    getClientBottlesOwed,
    getClientTransactions,
    getClientPayments,
    addTransaction,
    addPartialPayment,
    settleClient,
    returnBottles,
    refreshData
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};