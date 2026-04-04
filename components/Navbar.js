export default function Navbar() {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
      <h1 className="text-xl font-semibold">A-Flick</h1>
      <button className="bg-white text-black px-4 py-2 rounded-lg">
        Login
      </button>
    </div>
  );
}
