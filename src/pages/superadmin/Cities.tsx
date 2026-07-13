import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Plus, Search, Map, CheckCircle2, XCircle, Loader2, Save, X, Settings, ShieldAlert, Award } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Badge, Table } from '../../components/ui';
import { citiesApi } from '../../lib/api';

const CityAreaManagement = () => {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    state: 'Karnataka',
    country: 'India',
    active: true,
    radius: 30.0,
    demandMultiplier: 1.0,
    airportSurchargeEnabled: false,
    airportSurchargeAmount: 0.0,
    tollEnabled: false,
    averageTollCharge: 0.0,
    latitude: 12.9716,
    longitude: 77.5946
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await citiesApi.getAll(0, 50);
      setCities(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await citiesApi.create(formData);
      setShowModal(false);
      setFormData({
        name: '',
        district: '',
        state: 'Karnataka',
        country: 'India',
        active: true,
        radius: 30.0,
        demandMultiplier: 1.0,
        airportSurchargeEnabled: false,
        airportSurchargeAmount: 0.0,
        tollEnabled: false,
        averageTollCharge: 0.0,
        latitude: 12.9716,
        longitude: 77.5946
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create city');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await citiesApi.toggle(id, !currentStatus);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">City & Area Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Configure regions where services are available.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add New City</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between border-b-0 pb-0">
             <h3 className="font-bold text-slate-900 dark:text-white">Service Cities (Karnataka)</h3>
             <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>Refresh</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase">
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">District</th>
                    <th className="px-6 py-4">Surcharges / Tolls</th>
                    <th className="px-6 py-4">Radius / Multiplier</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading cities...</td></tr>
                  ) : cities.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No cities configured</td></tr>
                  ) : cities.map(city => (
                    <tr key={city.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 dark:text-white">{city.name}</span>
                        <div className="text-xs text-slate-400">{city.latitude}, {city.longitude}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{city.district || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          <div>Airport: {city.airportSurchargeEnabled ? `₹${city.airportSurchargeAmount || 0}` : 'Disabled'}</div>
                          <div>Tolls: {city.tollEnabled ? `₹${city.averageTollCharge || 0}` : 'Disabled'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{city.radius || city.radiusKm || 30} KM</div>
                        <div className="text-xs text-indigo-600 font-medium">Multiplier: {city.demandMultiplier || 1.0}x</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={city.active ? 'success' : 'default'}>
                          {city.active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(city.id, city.active)}>
                          Toggle Status
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-900 dark:text-white">Geofencing Stats</h3>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 mb-4">
                <Map className="w-8 h-8 text-indigo-600 mb-2" />
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Live Regions</h4>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300">You have {cities.filter(c => c.active).length} active operational zones.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto max-h-[90vh]">
            <CardHeader className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg">Add New City</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">City Name *</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">District *</label>
                    <input required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Latitude *</label>
                    <input required type="number" step="0.0001" value={formData.latitude} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Longitude *</label>
                    <input required type="number" step="0.0001" value={formData.longitude} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Operating Radius (KM)</label>
                    <input type="number" required value={formData.radius} onChange={e => setFormData({...formData, radius: Number(e.target.value)})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Demand Multiplier</label>
                    <input type="number" step="0.05" min="1.0" max="3.0" required value={formData.demandMultiplier} onChange={e => setFormData({...formData, demandMultiplier: parseFloat(e.target.value)})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-4 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Additional Charges & Tolls</h4>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable Airport Surcharge</label>
                    <input type="checkbox" checked={formData.airportSurchargeEnabled} onChange={e => setFormData({...formData, airportSurchargeEnabled: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
                  </div>
                  {formData.airportSurchargeEnabled && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Airport Surcharge Amount (INR)</label>
                      <input type="number" value={formData.airportSurchargeAmount} onChange={e => setFormData({...formData, airportSurchargeAmount: parseFloat(e.target.value)})} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 rounded-lg outline-none border border-slate-200 dark:border-slate-700" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable Toll Charges</label>
                    <input type="checkbox" checked={formData.tollEnabled} onChange={e => setFormData({...formData, tollEnabled: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
                  </div>
                  {formData.tollEnabled && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Average Toll Surcharge (INR)</label>
                      <input type="number" value={formData.averageTollCharge} onChange={e => setFormData({...formData, averageTollCharge: parseFloat(e.target.value)})} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 rounded-lg outline-none border border-slate-200 dark:border-slate-700" />
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={saving} className="w-full mt-4 flex justify-center items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save City
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CityAreaManagement;
