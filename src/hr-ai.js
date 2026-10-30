import { DEPARTMENTS } from './data.js';

export const COMPANY_STAFF = DEPARTMENTS.length;

export const LEGAL_SOURCES = [
  { code: 'BLLĐ 2019', name: 'Bộ luật Lao động 2019 (45/2019/QH14)', note: 'Quyền và nghĩa vụ của người sử dụng lao động' },
  { code: 'NĐ 145/2020', name: 'Nghị định 145/2020/NĐ-CP', note: 'Hướng dẫn Bộ luật Lao động về điều kiện lao động' },
  { code: 'Luật BHXH 2024', name: 'Luật Bảo hiểm xã hội 2024 (41/2024/QH15)', note: 'Hiệu lực từ 01/7/2025' },
  { code: 'Luật ATVSLĐ 2015', name: 'Luật An toàn, vệ sinh lao động 2015 (84/2015/QH13)', note: 'Huấn luyện, khám sức khỏe, tai nạn lao động' },
  { code: 'NĐ 136/2020', name: 'Nghị định 136/2020/NĐ-CP', note: 'Hướng dẫn Luật Phòng cháy, chữa cháy' },
  { code: 'NĐ 12/2022', name: 'Nghị định 12/2022/NĐ-CP', note: 'Xử phạt vi phạm hành chính về lao động, BHXH' },
];

const TASKS = [
  {
    id: 'contract-audit',
    category: 'Hồ sơ',
    priority: 'high',
    title: 'Rà soát hợp đồng lao động bằng văn bản',
    detail: 'Đối chiếu danh sách nhân sự với hợp đồng đã giao kết: đủ nội dung bắt buộc, mỗi bên giữ một bản, cập nhật khi thay đổi công việc hoặc tiền lương.',
    legal: 'BLLĐ 2019, Điều 13–16',
    deadline: 'Trước khi người lao động bắt đầu làm việc',
  },
  {
    id: 'social-insurance',
    category: 'Bảo hiểm',
    priority: 'high',
    title: 'Đối soát đóng BHXH, BHYT, BHTN tháng này',
    detail: 'Kiểm tra danh sách tham gia, mức đóng và thời hạn nộp; bổ sung người lao động mới trong thời hạn luật định.',
    legal: 'Luật BHXH 2024; Luật BHYT; Luật Việc làm 2013',
    deadline: 'Chậm nhất ngày cuối cùng của tháng',
  },
  {
    id: 'health-check',
    category: 'An toàn',
    priority: 'medium',
    title: 'Lập kế hoạch khám sức khỏe định kỳ',
    detail: 'Chọn cơ sở khám, phân loại sức khỏe và lưu hồ sơ quản lý sức khỏe người lao động.',
    legal: 'Luật ATVSLĐ 2015, Điều 21',
    deadline: 'Ít nhất 1 lần/năm; 6 tháng với nghề nặng nhọc',
  },
  {
    id: 'safety-training',
    category: 'An toàn',
    priority: 'high',
    title: 'Rà soát huấn luyện an toàn, vệ sinh lao động',
    detail: 'Kiểm tra chứng nhận huấn luyện theo nhóm công việc; tổ chức huấn luyện cho người mới hoặc khi thay đổi vị trí.',
    legal: 'Luật ATVSLĐ 2015, Điều 14; NĐ 44/2016/NĐ-CP',
    deadline: 'Trước khi làm việc; huấn luyện lại định kỳ',
  },
  {
    id: 'labor-report',
    category: 'Hồ sơ',
    priority: 'high',
    title: 'Chuẩn bị báo cáo tình hình sử dụng lao động',
    detail: 'Tổng hợp số lượng, cơ cấu lao động và gửi cơ quan chuyên môn về lao động cấp huyện.',
    legal: 'NĐ 145/2020/NĐ-CP, Điều 4',
    deadline: 'Trước 15/6 và trước 15/12 hằng năm',
  },
  {
    id: 'internal-rules',
    category: 'Quan hệ lao động',
    priority: 'medium',
    minStaff: 10,
    title: 'Rà soát nội quy lao động và niêm yết',
    detail: 'Kiểm tra nội dung về thời giờ làm việc, kỷ luật, an toàn; niêm yết tại nơi làm việc; đăng ký khi thuộc diện bắt buộc.',
    legal: 'BLLĐ 2019, Điều 118–119',
    deadline: 'Trước khi áp dụng; đăng ký khi sử dụng từ 10 lao động',
  },
  {
    id: 'salary-scale',
    category: 'Lương & thời giờ',
    priority: 'medium',
    title: 'Rà soát thang lương, bảng lương',
    detail: 'Đối chiếu mức lương theo công việc, chức danh với lương tối thiểu vùng và thỏa thuận trong hợp đồng lao động.',
    legal: 'BLLĐ 2019, Điều 93',
    deadline: 'Trước khi áp dụng; khi điều chỉnh lương tối thiểu',
  },
  {
    id: 'employee-dialogue',
    category: 'Quan hệ lao động',
    priority: 'medium',
    minStaff: 10,
    title: 'Chuẩn bị đối thoại định kỳ tại nơi làm việc',
    detail: 'Dự kiến nội dung đối thoại về điều kiện làm việc, quyền lợi; lập biên bản và công khai kết quả.',
    legal: 'BLLĐ 2019, Điều 63',
    deadline: 'Ít nhất 1 lần/năm (doanh nghiệp từ 10 lao động)',
  },
  {
    id: 'overtime-control',
    category: 'Lương & thời giờ',
    priority: 'high',
    title: 'Kiểm soát làm thêm giờ trong tháng',
    detail: 'Đối chiếu bảng chấm công làm thêm với hạn mức luật định; bảo đảm nghỉ bù và trả lương làm thêm đầy đủ.',
    legal: 'BLLĐ 2019, Điều 98 và Điều 107',
    deadline: 'Theo tháng',
  },
  {
    id: 'payroll-check',
    category: 'Lương & thời giờ',
    priority: 'medium',
    title: 'Kiểm tra bảng lương và phiếu lương',
    detail: 'Rà soát nội dung bắt buộc của bảng trả lương, cách tính các khoản khấu trừ và thời điểm trả lương.',
    legal: 'BLLĐ 2019, Điều 94–97',
    deadline: 'Theo kỳ trả lương',
  },
  {
    id: 'annual-leave',
    category: 'Lương & thời giờ',
    priority: 'low',
    title: 'Theo dõi phép năm và nghỉ lễ',
    detail: 'Cập nhật số ngày phép đã dùng, bố trí nghỉ hợp lý và thanh toán tiền phép còn lại khi chấm dứt hợp đồng lao động.',
    legal: 'BLLĐ 2019, Điều 112–113',
    deadline: 'Trước kỳ nghỉ / cuối năm',
  },
  {
    id: 'harassment-policy',
    category: 'Quan hệ lao động',
    priority: 'medium',
    title: 'Rà soát quy định phòng, chống quấy rối',
    detail: 'Kiểm tra quy định nội bộ, kênh tiếp nhận và biện pháp bảo vệ; phổ biến tới toàn bộ người lao động.',
    legal: 'BLLĐ 2019, Điều 3; NĐ 145/2020/NĐ-CP',
    deadline: 'Duy trì; rà soát định kỳ 6 tháng',
  },
  {
    id: 'fire-safety',
    category: 'An toàn',
    priority: 'medium',
    title: 'Kiểm tra an toàn phòng cháy, chữa cháy',
    detail: 'Rà soát phương tiện PCCC, lối thoát nạn, biển chỉ dẫn và kế hoạch diễn tập tại văn phòng.',
    legal: 'Luật PCCC; NĐ 136/2020/NĐ-CP',
    deadline: 'Kiểm tra định kỳ; huấn luyện theo quy định',
  },
  {
    id: 'accident-report',
    category: 'An toàn',
    priority: 'low',
    title: 'Tổng hợp báo cáo tai nạn lao động',
    detail: 'Cập nhật sổ theo dõi tai nạn, sự cố và chuẩn bị số liệu báo cáo định kỳ.',
    legal: 'Luật ATVSLĐ 2015; NĐ 39/2016/NĐ-CP',
    deadline: 'Báo cáo 6 tháng và hằng năm',
  },
];

const PRIORITY_LABEL = { high: 'Ưu tiên cao', medium: 'Trung bình', low: 'Duy trì' };

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatViDate(date = new Date()) {
  const s = date.toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatViTime(ts) {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function daysUntilMonthDay(date, month, day) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let target = new Date(date.getFullYear(), month - 1, day);
  if (target < start) target = new Date(date.getFullYear() + 1, month - 1, day);
  return Math.round((target - start) / 86400000);
}

function pickIndexes(seed, poolLen, count) {
  const out = [];
  if (poolLen <= 0 || count <= 0) return out;
  const h = Math.imul(seed, 2654435761) >>> 0;
  const step = 1 + ((h >>> 11) % Math.max(1, poolLen - 1));
  let cur = h % poolLen;
  while (out.length < Math.min(count, poolLen)) {
    if (!out.includes(cur)) out.push(cur);
    cur = (cur + step) % poolLen;
  }
  return out;
}

export function getDailyPlan(date = new Date()) {
  const key = dayKey(date);
  const seed = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const pool = TASKS.filter((t) => !t.minStaff || COMPANY_STAFF >= t.minStaff);
  const forced = [];

  const toReport = Math.min(daysUntilMonthDay(date, 6, 15), daysUntilMonthDay(date, 12, 15));
  if (toReport <= 30) {
    const task = pool.find((t) => t.id === 'labor-report');
    if (task) {
      forced.push({
        ...task,
        reason: toReport === 0
          ? 'Hôm nay là mốc báo cáo định kỳ (15/6 – 15/12)'
          : `Mốc báo cáo định kỳ còn ${toReport} ngày (15/6 – 15/12)`,
      });
    }
  }

  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const toMonthEnd = lastDay - date.getDate();
  if (toMonthEnd <= 5) {
    const task = pool.find((t) => t.id === 'social-insurance');
    if (task) {
      forced.push({
        ...task,
        reason: toMonthEnd === 0
          ? `Hôm nay là hạn đóng bảo hiểm tháng ${date.getMonth() + 1}`
          : `Kỳ đóng bảo hiểm tháng ${date.getMonth() + 1} còn ${toMonthEnd} ngày`,
      });
    }
  }

  const rest = pool.filter((t) => !forced.some((f) => f.id === t.id));
  const picked = pickIndexes(seed, rest.length, 2 - forced.length).map((i) => rest[i]);
  const tasks = [...forced, ...picked].slice(0, 2).map((t) => ({
    ...t,
    priorityLabel: PRIORITY_LABEL[t.priority] || PRIORITY_LABEL.low,
  }));

  return { date, key, tasks };
}

const STORAGE_KEY = 'tts-hr-ai-v1';

export function loadAIState(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (raw && raw.date === key) {
      return {
        date: raw.date,
        done: Array.isArray(raw.done) ? raw.done : [],
        sentAt: raw.sentAt || null,
      };
    }
  } catch {
    return { date: key, done: [], sentAt: null };
  }
  return { date: key, done: [], sentAt: null };
}

export function saveAIState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    return;
  }
}
