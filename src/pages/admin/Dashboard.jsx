export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">Pastors</div>
        <div className="bg-white p-4 rounded-xl shadow">Events</div>
        <div className="bg-white p-4 rounded-xl shadow">Messages</div>
      </div>
    </div>
  );
}