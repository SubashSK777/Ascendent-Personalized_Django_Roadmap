import Navbar from "../components/Navbar";
import Card from "../components/Card";

export default function Home() {
  return (
    <div>
      <Navbar />

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Active Clients" value="120" />
        <Card title="Services Done" value="340" />
        <Card title="Revenue" value="₹2.4L" />
      </div>

      <div className="p-6">
        <div className="bg-gray-900 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">Overview</h2>
          <p className="text-gray-400">
            Minimal dashboard for pest control management.
          </p>
        </div>
      </div>
    </div>
  );
}
