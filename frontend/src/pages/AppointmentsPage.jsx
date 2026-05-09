import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Star } from "lucide-react";
import { api } from "../lib/api";
import PaymentModal from "../components/PaymentModal";
import NoticeBanner from "../components/NoticeBanner";

const fallbackDoctors = [
  {
    _id: "doc_1",
    fullName: "BS. CKII Đặng Văn Hào",
    specialty: "Nhi khoa",
    hospital: "Bệnh viện Sản Nhi Đà Nẵng",
    experienceYears: 20,
    rating: 4.9,
    avatarColor: "#2b7edb",
    avatarUrl:
      "https://cdn.youmed.vn/photos/6528e610-a541-4bba-8cd0-952046a28999.jpg",
    timeSlots: ["08:00", "09:30", "10:45", "14:00", "15:30", "16:15"],
  },
  {
    _id: "doc_2",
    fullName: "BS. CKII Lê Thị Thanh Xuân",
    specialty: "Nội tổng quát",
    hospital: "Bệnh viện Đà Nẵng",
    experienceYears: 17,
    rating: 4.8,
    avatarColor: "#0ea5a2",
    avatarUrl:
      "https://ykhoavietduc.com/pic/Hotel/images/Dang%20Thi%20Xuan.jpg",
    timeSlots: ["08:30", "09:00", "14:00", "15:00", "16:00"],
  },
  {
    _id: "doc_3",
    fullName: "ThS. BS Lê Như Ngọc",
    specialty: "Sản phụ khoa",
    hospital: "Bệnh viện Phụ sản - Nhi",
    experienceYears: 12,
    rating: 4.8,
    avatarColor: "#2563eb",
    avatarUrl:
      "https://images.pexels.com/photos/7904457/pexels-photo-7904457.jpeg?cs=srgb&dl=pexels-anntarazevich-7904457.jpg&fm=jpg",
    timeSlots: ["07:30", "08:15", "09:00", "13:30", "14:45", "16:00"],
  },
  {
    _id: "doc_4",
    fullName: "BS. CKI Nguyễn Thu Hà",
    specialty: "Nội tiêu hóa",
    hospital: "Bệnh viện Hoàn Mỹ Đà Nẵng",
    experienceYears: 10,
    rating: 4.7,
    avatarColor: "#1d9bf0",
    avatarUrl:
      "https://images.pexels.com/photos/7904470/pexels-photo-7904470.jpeg?cs=srgb&dl=pexels-anntarazevich-7904470.jpg&fm=jpg",
    timeSlots: ["08:00", "09:00", "10:00", "13:30", "15:00"],
  },
  {
    _id: "doc_5",
    fullName: "BS. CKII Trần Văn Minh",
    specialty: "Tim mạch",
    hospital: "Bệnh viện C Đà Nẵng",
    experienceYears: 18,
    rating: 4.9,
    avatarColor: "#0f7b9b",
    avatarUrl:
      "https://images.pexels.com/photos/28755708/pexels-photo-28755708.jpeg?cs=srgb&dl=pexels-pexels-user-1920570806-28755708.jpg&fm=jpg",
    timeSlots: ["08:15", "09:45", "11:00", "14:30", "16:00"],
  },
  {
    _id: "doc_6",
    fullName: "BS. CKI Phạm Hoàng Sơn",
    specialty: "Da liễu",
    hospital: "Bệnh viện Vinmec Đà Nẵng",
    experienceYears: 9,
    rating: 4.6,
    avatarColor: "#3d5afe",
    avatarUrl:
      "https://images.pexels.com/photos/12889997/pexels-photo-12889997.jpeg?cs=srgb&dl=pexels-redwolf-44736300-12889997.jpg&fm=jpg",
    timeSlots: ["08:00", "09:30", "10:30", "14:00", "15:00"],
  },
];

const BOOKING_LEAD_MINUTES = 60;

const toDateKey = (value = dayjs()) => dayjs(value).format("YYYY-MM-DD");

const toAppointmentIso = (dateKey, slotLabel) => {
  const [hour, minute] = String(slotLabel || "00:00").split(":");
  return dayjs(dateKey)
    .hour(Number(hour))
    .minute(Number(minute))
    .second(0)
    .millisecond(0)
    .toISOString();
};

const AppointmentsPage = () => {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    hospitals: [],
    specialties: [],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    hospital: "",
    specialty: searchParams.get("specialty") || "",
    minRating: "",
    q: searchParams.get("q") || "",
  });
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedDateByDoctor, setSelectedDateByDoctor] = useState({});

  const loadDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/doctors", { params: selectedFilters });
      const list = data.doctors || [];
      setDoctors(list.length ? list : fallbackDoctors);
    } catch (err) {
      setDoctors(fallbackDoctors);
      setError(err?.response?.data?.message || "Đang hiển thị danh sách bác sĩ mặc định.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters.hospital, selectedFilters.specialty, selectedFilters.minRating, selectedFilters.q]);

  // Update filters from URL params
  useEffect(() => {
    const specialty = searchParams.get("specialty");
    const q = searchParams.get("q");

    if (specialty !== selectedFilters.specialty || q !== selectedFilters.q) {
      setSelectedFilters(prev => ({
        ...prev,
        specialty: specialty || "",
        q: q || "",
      }));
    }
  }, [searchParams, selectedFilters.specialty, selectedFilters.q]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [hospitalsRes, doctorsRes] = await Promise.all([
          api.get("/doctors/hospitals"),
          api.get("/doctors"),
        ]);
        const hospitals = hospitalsRes.data.hospitals || [];
        const specialties = [
          ...new Set((doctorsRes.data.doctors || []).map((item) => item.specialty)),
        ];
        setFilterOptions({
          hospitals: hospitals.length
            ? hospitals
            : [...new Set(fallbackDoctors.map((item) => item.hospital))],
          specialties: specialties.length
            ? specialties
            : [...new Set(fallbackDoctors.map((item) => item.specialty))],
        });
      } catch {
        setFilterOptions({
          hospitals: [...new Set(fallbackDoctors.map((item) => item.hospital))],
          specialties: [...new Set(fallbackDoctors.map((item) => item.specialty))],
        });
      }
    };

    loadFilterOptions();
  }, []);

  const hospitals = useMemo(() => filterOptions.hospitals, [filterOptions.hospitals]);
  const specialties = useMemo(() => filterOptions.specialties, [filterOptions.specialties]);

  const createBooking = async (doctor, slotLabel) => {
    setError("");
    const selectedDate = selectedDateByDoctor[doctor._id] || toDateKey();
    const appointmentMoment = dayjs(toAppointmentIso(selectedDate, slotLabel));
    if (appointmentMoment.isBefore(dayjs().add(BOOKING_LEAD_MINUTES, "minute"))) {
      setError("Không thể đặt lịch đã qua hoặc quá sát giờ khám. Vui lòng chọn giờ khác.");
      return;
    }

    try {
      const { data } = await api.post(`/doctors/${doctor._id}/book`, {
        slotLabel,
        appointmentAt: appointmentMoment.toISOString(),
        notes: "Đặt lịch từ giao diện bác sĩ nổi bật",
      });
      setBooking(data);
      setEmailNotice("Bệnh nhân có thể truy cập email của mình để xem thông báo gửi về email.");
    } catch (err) {
      setEmailNotice("");
      setError(err?.response?.data?.message || "Không thể tạo lịch hẹn");
    }
  };

  const payBooking = async () => {
    if (!booking?.appointment?._id) return;
    setPaying(true);
    try {
      await api.patch(`/doctors/bookings/${booking.appointment._id}/pay`);
      setBooking(null);
      setError("");
    } finally {
      setPaying(false);
    }
  };

  return (
    <section className="doctor-page">
      <aside className="doctor-filter-card">
        <h3>Bộ lọc</h3>
        <label>Bệnh viện</label>
        <select
          value={selectedFilters.hospital}
          onChange={(e) => setSelectedFilters((prev) => ({ ...prev, hospital: e.target.value }))}
        >
          <option value="">Tất cả</option>
          {hospitals.map((hospital) => (
            <option key={hospital} value={hospital}>
              {hospital}
            </option>
          ))}
        </select>

        <label>Chuyên khoa</label>
        <select
          value={selectedFilters.specialty}
          onChange={(e) =>
            setSelectedFilters((prev) => ({ ...prev, specialty: e.target.value }))
          }
        >
          <option value="">Tất cả</option>
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>

        <label>Xếp hạng</label>
        <select
          value={selectedFilters.minRating}
          onChange={(e) =>
            setSelectedFilters((prev) => ({ ...prev, minRating: e.target.value }))
          }
        >
          <option value="">Tất cả</option>
          <option value="4.5">4.5 sao trở lên</option>
          <option value="4.8">4.8 sao trở lên</option>
        </select>
      </aside>

      <div className="doctor-main">
        <div className="section-title-row">
          <h1>Bác sĩ nổi bật tại Đà Nẵng.</h1>
          <p className="muted">{doctors.length} bác sĩ tìm thấy</p>
        </div>

        {emailNotice ? (
          <NoticeBanner
            title="Thông báo email"
            message={emailNotice}
            tone="info"
            className="appointments-notice"
            onClose={() => setEmailNotice("")}
          />
        ) : null}

        {loading ? <p className="muted">Đang tải danh sách bác sĩ...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <div className="stack-md">
          {doctors.map((doctor) => (
            <article className="doctor-card" key={doctor._id}>
              <div className="doctor-card-left">
                <div
                  className="doctor-photo"
                  style={{ background: doctor.avatarColor || "#2b7edb" }}
                >
                  {doctor.avatarUrl ? (
                    <img src={doctor.avatarUrl} alt={doctor.fullName} />
                  ) : (
                    doctor.fullName
                      .split(" ")
                      .slice(-2)
                      .map((item) => item[0])
                      .join("")
                  )}
                </div>
                <div>
                  <h3>{doctor.fullName}</h3>
                  <p className="muted">{doctor.specialty}</p>
                  <p className="muted">{doctor.hospital}</p>
                  <div className="tag-row">
                    <span className="tag">{doctor.experienceYears} năm KN</span>
                    <span className="tag">
                      <Star size={12} /> {doctor.rating}
                    </span>
                  </div>
                </div>
              </div>

              <div className="doctor-card-right">
                <p>Khảo sát giờ khám theo ngày</p>
                <input
                  type="date"
                  value={selectedDateByDoctor[doctor._id] || toDateKey()}
                  min={toDateKey()}
                  onChange={(e) =>
                    setSelectedDateByDoctor((prev) => ({
                      ...prev,
                      [doctor._id]: e.target.value,
                    }))
                  }
                />
                <div className="slot-grid">
                  {(doctor.timeSlots || [])
                    .filter((slot) => {
                      const selectedDate = selectedDateByDoctor[doctor._id] || toDateKey();
                      const slotMoment = dayjs(toAppointmentIso(selectedDate, slot));
                      return slotMoment.isAfter(dayjs().add(BOOKING_LEAD_MINUTES, "minute"));
                    })
                    .map((slot) => (
                      <button
                        key={`${doctor._id}_${slot}`}
                        type="button"
                        onClick={() => createBooking(doctor, slot)}
                      >
                        {slot}
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const selectedDate = selectedDateByDoctor[doctor._id] || toDateKey();
                    const firstAvailable = (doctor.timeSlots || []).find((slot) =>
                      dayjs(toAppointmentIso(selectedDate, slot)).isAfter(
                        dayjs().add(BOOKING_LEAD_MINUTES, "minute")
                      )
                    );
                    if (firstAvailable) {
                      createBooking(doctor, firstAvailable);
                    } else {
                      setError("Không còn khung giờ phù hợp trong ngày đã chọn.");
                    }
                  }}
                  disabled={!doctor.timeSlots?.length}
                >
                  Đặt lịch ngay
                </button>
              </div>
            </article>
          ))}
          {!loading && doctors.length === 0 ? (
            <p className="muted">Chưa có dữ liệu bác sĩ để đặt lịch.</p>
          ) : null}
        </div>
      </div>

      {booking ? (
        <PaymentModal
          booking={booking}
          onClose={() => setBooking(null)}
          onConfirm={payBooking}
          loading={paying}
        />
      ) : null}
    </section>
  );
};

export default AppointmentsPage;
