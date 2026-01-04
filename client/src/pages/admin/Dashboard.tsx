import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Package, Image, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, Banner, Category } from '@/types';
import { Loader } from '@/components/ui/loader';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, trend, trendUp }) => {
  return (
    <div className="admin-card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${trendUp ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className={`mt-4 flex items-center text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className={`h-3 w-3 mr-1 ${!trendUp && 'rotate-180'}`} />
          <span className="font-medium">{trend}</span>
          <span className="text-muted-foreground ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, bans, cats] = await Promise.all([
        api.getProducts(),
        api.getBanners(),
        api.getCategories()
      ]);
      setProducts(prods);
      setBanners(bans);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  // Calculate Stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const activeBanners = banners.filter((b) => b.isActive).length;

  // Prepare Chart Data
  const productsByCategory = categories.map(cat => ({
    name: cat.name,
    count: products.filter(p => p.categoryId === cat.id || p.categoryId === cat.categoryId).length
  })).filter(item => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          description="In your catalog"
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Active Products"
          value={activeProducts}
          icon={CheckCircle}
          description="Visible to customers"
        />
        <StatCard
          title="Active Banners"
          value={activeBanners}
          icon={Image}
          description="Live promotions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        {/* Products per Category Chart */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold mb-6">Top Categories by Product Count</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productsByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Enquiries & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Out of Stock</span>
              </div>
              <span className="font-bold">{products.filter(p => !p.isInStock).length}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Best Sellers</span>
              </div>
              <span className="font-bold">{products.filter(p => p.isBestSeller).length}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">On Offer</span>
              </div>
              <span className="font-bold">{products.filter(p => p.isOnOffer).length}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
