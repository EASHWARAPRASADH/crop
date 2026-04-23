import { createContext, useContext, useState, ReactNode } from 'react';
import { orderService } from '@/services/dataService';
import { toast } from 'sonner';

interface Order {
  id: string;
  projectId: string;
  templateId: string | null;
  status: 'draft' | 'uploaded' | 'validated' | 'approved' | 'generating' | 'generated' | 'exported' | 'archived';
  totalCards: number;
  generatedCards: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderContextType {
  currentOrder: Order | null;
  isLoading: boolean;
  refreshOrder: () => Promise<void>;
  createOrder: (data: any) => Promise<Order | null>;
  setOrder: (order: Order | null) => void;
  loadOrderById: (id: string) => Promise<Order | null>;
  updateStatus: (orderId: string, status: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(() => {
    const saved = localStorage.getItem('gotek_current_order');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshOrder = async () => {
    if (!currentOrder) return;
    try {
      const order = await orderService.getById(currentOrder.id);
      setCurrentOrder(order);
      localStorage.setItem('gotek_current_order', JSON.stringify(order));
    } catch (error) {
      console.error('Error refreshing order:', error);
    }
  };

  const createNewOrder = async (data: any): Promise<Order | null> => {
    try {
      setIsLoading(true);
      const order = await orderService.create(data);
      setCurrentOrder(order);
      localStorage.setItem('gotek_current_order', JSON.stringify(order));
      toast.success('Order created successfully');
      return order;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const updated = await orderService.updateStatus(orderId, status);
      setCurrentOrder(updated);
      localStorage.setItem('gotek_current_order', JSON.stringify(updated));
      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const setOrder = (order: Order | null) => {
    setCurrentOrder(order);
    if (order) localStorage.setItem('gotek_current_order', JSON.stringify(order));
    else localStorage.removeItem('gotek_current_order');
  };

  const loadOrderById = async (id: string): Promise<Order | null> => {
    try {
      setIsLoading(true);
      const order = await orderService.getById(id);
      setCurrentOrder(order);
      localStorage.setItem('gotek_current_order', JSON.stringify(order));
      return order;
    } catch (error) {
      console.error('Error loading order by ID:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        isLoading,
        refreshOrder,
        createOrder: createNewOrder,
        setOrder,
        loadOrderById,
        updateStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
