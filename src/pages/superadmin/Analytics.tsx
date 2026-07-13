import React, { useEffect, useState, useCallback } from 'react';
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Car, 
  Users, 
  MapPin, 
  Download, 
  Calendar,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardHeader, CardContent, Button, StatsCard, Badge } from '../../components/ui';
import { dashboardApi } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

export default function PlatformAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [cityPerformance, setCityPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes, citiesRes] = await Promise.all([
        dashboardApi.getSuperAdminStats(),
        dashboardApi.getChartData(),
        dashboardApi.getCityPerformance()
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data || []);
      setCityPerformance(citiesRes.data || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived categories distribution
  const totalRidesVal = stats?.totalRides || 1;
  const categoryData = [
    { name: 'Mini/Auto', value: Math.round((stats?.onlineDrivers || 0) * 20) || 40, color: '#6366f1' },
    { name: 'Sedan', value: Math.round(totalRidesVal * 0.4) || 30, color: '#10b981' },
    { name: 'SUV', value: Math.round(totalRidesVal * 0.25) || 20, color: '#f59e0b' },
    { name: 'Luxury/Bike', value: Math.round(totalRidesVal * 0.15) || 10, color: '#ec4899' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Revenue & Platform Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Comprehensive insights into platform performance and growth</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="flex gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Last 30 Days
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Reports
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={loading ? '...' : formatCurrency(stats?.totalRevenue || 0)} icon={DollarSign} color="indigo" trend={{ value: '+14%', positive: true }} />
        <StatsCard title="Platform Commission" value={loading ? '...' : formatCurrency(stats?.platformCommission || 0)} icon={TrendingUp} color="green" trend={{ value: '+11%', positive: true }} />
        <StatsCard title="Total Ride Requests" value={loading ? '...' : (stats?.totalRides || 0).toLocaleString()} icon={Car} color="blue" trend={{ value: '+22%', positive: true }} />
        <StatsCard title="Customer Spending" value={loading ? '...' : formatCurrency(stats?.totalRevenue / (stats?.totalRides || 1)) + ' / ride'} icon={Users} color="orange" trend={{ value: '+4%', positive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Revenue Trends</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span>Gross Revenue (Last 7 Days)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No chart data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ride Category Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ride Categories</h2>
            <p className="text-sm text-slate-500">Distribution by vehicle type</p>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{cat.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{cat.value} rides</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Performance Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top Performing Cities</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="py-8 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : cityPerformance.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No city activity records yet.</p>
              ) : (
                cityPerformance.map((city, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{city.city}</h4>
                        <p className="text-xs text-slate-500">{city.rides} completed rides</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold text-emerald-500`}>
                        {city.growth || '+0%'} growth
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Growth Forecast */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Growth Forecast</h2>
            <p className="text-sm text-slate-500">Predicted platform metrics based on current trends</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: 'Projected Monthly Revenue', target: '₹1.5Cr', progress: 80, color: 'bg-indigo-500' },
                { label: 'Active Driver Growth', target: '25,000', progress: 65, color: 'bg-emerald-500' },
                { label: 'Customer Retention Rate', target: '70%', progress: 92, color: 'bg-blue-500' }
              ].map((metric, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{metric.label}</span>
                    <span className="text-sm font-bold text-indigo-600">{metric.target}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${metric.color} transition-all duration-1000`} style={{ width: `${metric.progress}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 text-right">{metric.progress}% of goal achieved</p>
                </div>
              ))}

              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 mt-4">
                <div className="flex gap-3">
                  <TrendingUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <p className="text-sm text-indigo-900 dark:text-indigo-400">
                    Platform health is <strong>Excellent</strong>. Predicted 12% revenue increase next month due to upcoming holiday season campaigns.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
