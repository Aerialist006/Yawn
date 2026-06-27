export function Spinner() {
  return (
    <div className="flex items-center justify-center w-full py-12">
      <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
    </div>
  );
}