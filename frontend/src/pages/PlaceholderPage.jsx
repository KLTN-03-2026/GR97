const PlaceholderPage = ({ title = "Đang cập nhật", description = "" }) => {
  return (
    <section className="placeholder-page">
      <h1>{title}</h1>
      <p className="muted">{description || "Module này sẽ được cập nhật trong phiên bản tiếp theo."}</p>
    </section>
  );
};

export default PlaceholderPage;
