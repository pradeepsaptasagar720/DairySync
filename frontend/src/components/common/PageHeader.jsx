export default function PageHeader({ title, subtitle }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-gray-900">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
