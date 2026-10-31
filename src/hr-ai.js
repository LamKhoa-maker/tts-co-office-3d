import { DEPARTMENTS } from './data.js';

export let COMPANY_STAFF = DEPARTMENTS.reduce((n, d) => n + (d.staffList?.length || 1), 0);

export function setCompanyStaff(n) {
  COMPANY_STAFF = Math.max(0, Number(n) || 0);
}

export const COMPANY = {
  founded: { month: 5, year: 2026 },
  label: '05/2026',
};

export const REPORT_HOUR = 9;

export function monthsOperating(date = new Date()) {
  const months = (date.getFullYear() - COMPANY.founded.year) * 12
    + (date.getMonth() + 1 - COMPANY.founded.month);
  return Math.max(0, months);
}

export const LEGAL_SOURCES = [
  { code: 'BLLĐ 2019', name: 'Bộ luật Lao động 2019 (45/2019/QH14)', note: 'Quyền và nghĩa vụ của người sử dụng lao động' },
  { code: 'NĐ 145/2020', name: 'Nghị định 145/2020/NĐ-CP', note: 'Hướng dẫn Bộ luật Lao động về điều kiện lao động' },
  { code: 'Luật BHXH 2024', name: 'Luật Bảo hiểm xã hội 2024 (41/2024/QH15)', note: 'Hiệu lực từ 01/7/2025' },
  { code: 'Luật ATVSLĐ 2015', name: 'Luật An toàn, vệ sinh lao động 2015 (84/2015/QH13)', note: 'Huấn luyện, khám sức khỏe, tai nạn lao động' },
  { code: 'NĐ 136/2020', name: 'Nghị định 136/2020/NĐ-CP', note: 'Hướng dẫn Luật Phòng cháy, chữa cháy' },
  { code: 'NĐ 12/2022', name: 'Nghị định 12/2022/NĐ-CP', note: 'Xử phạt vi phạm hành chính về lao động, BHXH' },
  { code: 'Luật Quản lý thuế 2019', name: 'Luật Quản lý thuế 2019 (38/2019/QH14)', note: 'Đăng ký, kê khai, nộp thuế của doanh nghiệp mới thành lập' },
  { code: 'NĐ 123/2020', name: 'Nghị định 123/2020/NĐ-CP', note: 'Hóa đơn, chứng từ điện tử' },
];

// window: khoảng tháng hoạt động mà việc này cấp thiết nhất kể từ khi thành lập
// deadlines: các mốc cố định trong năm [tháng, ngày]
// monthly: hạn chót vào cuối mỗi tháng
const TASKS = [
  {
    id: 'tax-setup',
    category: 'Thuế',
    priority: 'high',
    window: [0, 3],
    title: 'Hoàn tất đăng ký thuế và hóa đơn điện tử',
    detail: 'Đối chiếu thông tin đăng ký thuế với giấy chứng nhận đăng ký doanh nghiệp, đăng ký sử dụng hóa đơn điện tử và cấp tài khoản nộp thuế trước khi xuất hóa đơn đầu tiên.',
    legal: 'Luật Quản lý thuế 2019; NĐ 123/2020/NĐ-CP',
    deadline: 'Trước khi xuất hóa đơn đầu tiên',
  },
  {
    id: 'pccc-license',
    category: 'Điều kiện kinh doanh',
    priority: 'high',
    window: [0, 7],
    title: 'Rà soát điều kiện kinh doanh dịch vụ PCCC',
    detail: 'Kiểm tra giấy chứng nhận đủ điều kiện kinh doanh dịch vụ PCCC, người phụ trách chuyên môn và hồ sơ năng lực của kỹ sư thiết kế, thi công.',
    legal: 'Luật PCCC; NĐ 136/2020/NĐ-CP',
    deadline: 'Duy trì trong suốt thời gian hoạt động',
  },
  {
    id: 'contract-audit',
    category: 'Hồ sơ',
    priority: 'high',
    window: [0, 2],
    title: 'Rà soát hợp đồng lao động bằng văn bản',
    detail: 'Đối chiếu danh sách nhân sự với hợp đồng đã giao kết: đủ nội dung bắt buộc, mỗi bên giữ một bản, cập nhật khi thay đổi công việc hoặc tiền lương.',
    legal: 'BLLĐ 2019, Điều 13–16',
    deadline: 'Trước khi người lao động bắt đầu làm việc',
  },
  {
    id: 'social-insurance',
    category: 'Bảo hiểm',
    priority: 'high',
    monthly: true,
    title: 'Đối soát đóng BHXH, BHYT, BHTN tháng này',
    detail: 'Kiểm tra danh sách tham gia, mức đóng và thời hạn nộp; bổ sung người lao động mới trong thời hạn luật định.',
    legal: 'Luật BHXH 2024; Luật BHYT; Luật Việc làm 2013',
    deadline: 'Chậm nhất ngày cuối cùng của tháng',
  },
  {
    id: 'safety-training',
    category: 'An toàn',
    priority: 'high',
    window: [0, 6],
    title: 'Rà soát huấn luyện an toàn, vệ sinh lao động',
    detail: 'Kiểm tra chứng nhận huấn luyện theo nhóm công việc; tổ chức huấn luyện cho người mới hoặc khi thay đổi vị trí.',
    legal: 'Luật ATVSLĐ 2015, Điều 14; NĐ 44/2016/NĐ-CP',
    deadline: 'Trước khi làm việc; huấn luyện lại định kỳ',
  },
  {
    id: 'labor-report',
    category: 'Hồ sơ',
    priority: 'high',
    deadlines: [[6, 15], [12, 15]],
    title: 'Chuẩn bị báo cáo tình hình sử dụng lao động',
    detail: 'Tổng hợp số lượng, cơ cấu lao động và gửi cơ quan chuyên môn về lao động cấp huyện.',
    legal: 'NĐ 145/2020/NĐ-CP, Điều 4',
    deadline: 'Trước 15/6 và trước 15/12 hằng năm',
  },
  {
    id: 'health-check',
    category: 'An toàn',
    priority: 'medium',
    window: [2, 12],
    title: 'Lập kế hoạch khám sức khỏe định kỳ',
    detail: 'Chọn cơ sở khám, phân loại sức khỏe và lưu hồ sơ quản lý sức khỏe người lao động.',
    legal: 'Luật ATVSLĐ 2015, Điều 21',
    deadline: 'Ít nhất 1 lần/năm; 6 tháng với nghề nặng nhọc',
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
    window: [0, 6],
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
    window: [0, 6],
    title: 'Rà soát quy định phòng, chống quấy rối',
    detail: 'Kiểm tra quy định nội bộ, kênh tiếp nhận và biện pháp bảo vệ; phổ biến tới toàn bộ người lao động.',
    legal: 'BLLĐ 2019, Điều 3; NĐ 145/2020/NĐ-CP',
    deadline: 'Duy trì; rà soát định kỳ 6 tháng',
  },
  {
    id: 'fire-safety',
    category: 'An toàn',
    priority: 'medium',
    window: [0, 9],
    title: 'Kiểm tra an toàn phòng cháy, chữa cháy',
    detail: 'Rà soát phương tiện PCCC, lối thoát nạn, biển chỉ dẫn và kế hoạch diễn tập tại văn phòng.',
    legal: 'Luật PCCC; NĐ 136/2020/NĐ-CP',
    deadline: 'Kiểm tra định kỳ; huấn luyện theo quy định',
  },
  {
    id: 'first-audit',
    category: 'Thuế',
    priority: 'medium',
    window: [6, 12],
    title: 'Chuẩn bị quyết toán thuế và báo cáo tài chính năm đầu',
    detail: 'Chốt sổ kế toán năm tài chính đầu tiên, đối chiếu doanh thu – chi phí và chuẩn bị hồ sơ quyết toán thuế TNDN.',
    legal: 'Luật Kế toán 2015; Luật thuế TNDN; Luật Quản lý thuế 2019',
    deadline: 'Trong 90 ngày kể từ ngày kết thúc năm tài chính',
  },
  {
    id: 'accident-report',
    category: 'An toàn',
    priority: 'low',
    window: [6, 12],
    title: 'Tổng hợp báo cáo tai nạn lao động',
    detail: 'Cập nhật sổ theo dõi tai nạn, sự cố và chuẩn bị số liệu báo cáo định kỳ.',
    legal: 'Luật ATVSLĐ 2015; NĐ 39/2016/NĐ-CP',
    deadline: 'Báo cáo 6 tháng và hằng năm',
  },
];

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

const LEVELS = [
  { min: 7.5, level: 'urgent', label: 'Khẩn cấp' },
  { min: 6, level: 'high', label: 'Ưu tiên cao' },
  { min: 4, level: 'medium', label: 'Trung bình' },
  { min: 0, level: 'low', label: 'Duy trì' },
];

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

function nearestDeadline(date, deadlines) {
  let best = null;
  for (const [month, day] of deadlines) {
    const days = daysUntilMonthDay(date, month, day);
    if (!best || days < best.days) best = { days, month, day };
  }
  return best;
}

function levelFor(score) {
  return LEVELS.find((l) => score >= l.min) || LEVELS[LEVELS.length - 1];
}

function scoreTask(task, date, months, seed, index) {
  let score = PRIORITY_WEIGHT[task.priority] || 1;
  let reason = '';

  if (task.window) {
    const [from, to] = task.window;
    if (months >= from && months <= to) {
      score += 3.2;
      reason = `Công ty thành lập ${COMPANY.label} · đang ở tháng thứ ${months + 1} hoạt động`;
    } else if (months < from) {
      score -= 1;
    }
  }

  if (task.deadlines) {
    const next = nearestDeadline(date, task.deadlines);
    score += Math.max(0, 5 - next.days / 20);
    reason = next.days === 0
      ? `Hôm nay là hạn ${next.day}/${next.month}`
      : `Còn ${next.days} ngày tới hạn ${next.day}/${next.month}`;
  }

  if (task.monthly) {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const toEnd = lastDay - date.getDate();
    score += Math.max(0, 4.5 - toEnd * 0.65);
    reason = toEnd === 0
      ? `Hôm nay là hạn chót tháng ${date.getMonth() + 1}`
      : `Còn ${toEnd} ngày tới hạn tháng ${date.getMonth() + 1}`;
  }

  score += ((Math.imul(seed + index, 2654435761) >>> 0) % 1000) / 1000 * 0.8;
  return { score, reason };
}

export function getDailyPlan(date = new Date()) {
  const key = dayKey(date);
  const seed = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const months = monthsOperating(date);
  const pool = TASKS.filter((t) => !t.minStaff || COMPANY_STAFF >= t.minStaff);

  const tasks = pool
    .map((task, i) => {
      const { score, reason } = scoreTask(task, date, months, seed, i);
      const level = levelFor(score);
      return { ...task, score, reason, level: level.level, priorityLabel: level.label };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((task, i) => ({ ...task, rank: i + 1 }));

  return { date, key, months, tasks };
}

const STORAGE_KEY = 'tts-hr-ai-v1';
const REPORT_KEY = 'tts-hr-reports-v1';

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

export function loadReports() {
  try {
    const raw = JSON.parse(localStorage.getItem(REPORT_KEY) || 'null');
    if (raw && Array.isArray(raw.items)) {
      return { lastAuto: raw.lastAuto || null, items: raw.items.slice(0, 12) };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { lastAuto: null, items: [] };
}

export function saveReports(state) {
  try {
    localStorage.setItem(REPORT_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}
