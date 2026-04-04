export default function Card({ title, value }) {
  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg hover:scale-105 transition">
      <h2 className="text-sm text-gray-400">{title}</h2>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
