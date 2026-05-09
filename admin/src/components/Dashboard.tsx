import React, { useMemo } from 'react';
import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { OverviewStats } from '../types';

interface DashboardProps {
  overview: OverviewStats | null;
  stats: Partial<OverviewStats> | null;
}

const Dashboard: React.FC<DashboardProps> = memo(({ overview, stats }) => {
  const cards = useMemo(
    () => [
      {
        key: 'appointments',
        label: 'Tổng cuộc hẹn',
        value: stats?.cards?.appointmentsCount ?? overview?.cards?.appointmentsCount ?? 0,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
        color: 'blue',
      },
      {
        key: 'doctors',
        label: 'Tổng bác sĩ',
        value: stats?.cards?.doctorsCount ?? overview?.cards?.doctorsCount ?? 0,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        color: 'green',
      },
      {
        key: 'paid',
        label: 'Đã thanh toán',
        value: stats?.paidCount ?? 0,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <circle cx="12" cy="16" r="1" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ),
        color: 'purple',
      },
      {
        key: 'revenue',
        label: 'Doanh thu tháng',
        value: `${(stats?.cards?.monthlyRevenue || 0).toLocaleString('vi-VN')} đ`,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
        color: 'orange',
      },
    ],
    [overview, stats]
  );

  const appointmentChartData = useMemo(() => {
    if (!overview?.chartSeries) return [];
    return overview.chartSeries.map((item) => ({
      name: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      appointments: item.count,
    }));
  }, [overview]);

  const statusChartData = useMemo(() => {
    if (!stats?.statusCounts) return [];
    const statusMapData = [
      { name: 'Chờ xác nhận', value: stats.statusCounts.pending || 0, color: '#f59e0b' },
      { name: 'Đã xác nhận', value: stats.statusCounts.confirmed || 0, color: '#3b82f6' },
      { name: 'Hoàn thành', value: stats.statusCounts.completed || 0, color: '#10b981' },
      { name: 'Đã hủy', value: stats.statusCounts.cancelled || 0, color: '#ef4444' },
    ];
    return statusMapData.filter((item) => item.value > 0);
  }, [stats]);

  const topDoctorsChartData = useMemo(() => {
    if (!stats?.topDoctors) return [];
    return stats.topDoctors.map((doctor) => ({
      name: doctor.doctorName?.length > 15 ? doctor.doctorName.substring(0, 15) + '...' : doctor.doctorName,
      appointments: doctor.appointments,
      completed: doctor.completed,
    }));
  }, [stats]);

  const statusMap = {
    pending: { label: 'Chờ xác nhận', color: 'status-pending' },
    confirmed: { label: 'Đã xác nhận', color: 'status-confirmed' },
    completed: { label: 'Hoàn thành', color: 'status-completed' },
    cancelled: { label: 'Đã hủy', color: 'status-cancelled' },
  };

  return (
    <div className="overview-page">
      {/* Stat Cards */}
      <div className="cards-grid">
        {cards.map((card) => (
          <div key={card.key} className={`stat-card card-${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-body">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Appointments Bar Chart */}
        <div className="panel panel-wide">
          <div className="panel-header">
            <h3>Lịch hẹn 7 ngày gần nhất</h3>
          </div>
          <div className="chart-container">
            {appointmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={appointmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [value, 'Lịch hẹn']}
                  />
                  <Bar dataKey="appointments" fill="#667eea" radius={[4, 4, 0, 0]} name="Lịch hẹn" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">Chưa có dữ liệu lịch hẹn</div>
            )}
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="panel ai-legacy-empty">
          <div className="panel-header">
            <h3>Tỷ lệ trạng thái</h3>
          </div>
          <div className="chart-container">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Top Doctors Bar Chart */}
        <div className="panel panel-wide">
          <div className="panel-header">
            <h3>Top 5 bác sĩ có nhiều lịch hẹn nhất</h3>
          </div>
          <div className="chart-container">
            {topDoctorsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topDoctorsChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value, name) => [value, name === 'appointments' ? 'Tổng lịch hẹn' : 'Hoàn thành']}
                  />
                  <Bar dataKey="appointments" fill="#10b981" name="Tổng lịch hẹn" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="completed" fill="#3b82f6" name="Hoàn thành" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">Chưa có dữ liệu bác sĩ</div>
            )}
          </div>
        </div>
      </div>

      {/* Status + Recent */}
      <div className="panels-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Trạng thái cuộc hẹn</h3>
          </div>
          <div className="status-grid">
            {[
              { key: 'pending', label: 'Chờ xác nhận', val: stats?.statusCounts?.pending || 0, cls: 'pending' },
              { key: 'confirmed', label: 'Đã xác nhận', val: stats?.statusCounts?.confirmed || 0, cls: 'confirmed' },
              { key: 'completed', label: 'Hoàn thành', val: stats?.statusCounts?.completed || 0, cls: 'completed' },
              { key: 'cancelled', label: 'Đã hủy', val: stats?.statusCounts?.cancelled || 0, cls: 'cancelled' },
            ].map((s) => (
              <div key={s.key} className={`status-box status-box-${s.cls}`}>
                <div className="status-box-val">{s.val}</div>
                <div className="status-box-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel panel-wide">
          <div className="panel-header">
            <h3>Lịch hẹn gần đây</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.recentAppointments || []).slice(0, 8).map((item) => {
                  const st = statusMap[item.status] || { label: item.status, color: '' };
                  return (
                    <tr key={item._id}>
                      <td>{item.user?.fullName || 'Khách hàng'}</td>
                      <td>{item.doctor?.fullName || item.doctorName || 'Bác sĩ'}</td>
                      <td>{new Date(item.appointmentAt).toLocaleString('vi-VN')}</td>
                      <td>
                        <span className={`badge ${st.color}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {(overview?.recentAppointments || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-row">
                      Chưa có lịch hẹn nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;