import { DEPARTMENTS, LAW_GROUPS } from './data.js';

export const SAMPLE_LABEL = 'Dữ liệu mẫu';

const DAY = 86400000;
const ACTIVE_STAGES = new Set(['executing', 'handover']);

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dayOffset(offset, base = new Date()) {
  const d = startOfDay(base);
  d.setDate(d.getDate() + offset);
  return d;
}

export function daysUntil(date, now = new Date()) {
  return Math.round((startOfDay(date) - startOfDay(now)) / DAY);
}

export function fmtShortDate(date) {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function fmtDue(date, now = new Date()) {
  const n = daysUntil(date, now);
  if (n < 0) return `quá hạn ${Math.abs(n)} ngày`;
  if (n === 0) return 'đến hạn hôm nay';
  return `còn ${n} ngày`;
}

export function fmtTime(date) {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function fmtVnd(value) {
  const v = Math.abs(Number(value) || 0);
  if (v >= 1e9) return `${(v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} triệu`;
  return `${v.toLocaleString('vi-VN')} đ`;
}

const sumBy = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);

export const CASH_BALANCE = 2450e6;

export const CONTRACTS = [
  { id: 'c-vsip', code: 'HĐ-2601', client: 'Nhà máy điện tử VSIP Bắc Ninh', sector: 'Novec 1230', value: 3.2e9, paid: 0.96e9, stage: 'executing', signedOffset: -120, dueOffset: 20 },
  { id: 'c-muongthanh', code: 'HĐ-2602', client: 'Khách sạn Mường Thanh Nha Trang', sector: 'FM-200', value: 1.85e9, paid: 1.4e9, stage: 'executing', signedOffset: -160, dueOffset: -72 },
  { id: 'c-dongnai', code: 'HĐ-2603', client: 'Bệnh viện Đa khoa Đồng Nai', sector: 'IG-541', value: 2.4e9, paid: 2.0e9, stage: 'handover', signedOffset: -220, dueOffset: -12 },
  { id: 'c-vcb', code: 'HĐ-2604', client: 'Vietcombank Tower', sector: 'FM-200', value: 0.98e9, paid: 0.98e9, stage: 'closed', signedOffset: -300, dueOffset: -120 },
  { id: 'c-longan', code: 'HĐ-2605', client: 'Kho lạnh Long An', sector: 'Novec 1230', value: 1.2e9, paid: 1.2e9, stage: 'closed', signedOffset: -260, dueOffset: -90 },
  { id: 'c-binhduong', code: 'HĐ-2606', client: 'Nhà máy dệt may Bình Dương', sector: 'IG-541', value: 1.35e9, paid: 0.4e9, stage: 'executing', signedOffset: -35, dueOffset: 45 },
];

export const PIPELINE = [
  { id: 'p-fpt', client: 'Trung tâm dữ liệu FPT Hòa Lạc', value: 4.6e9, status: 'open', stage: 'quote', prob: 0.6, expectedOffset: 45 },
  { id: 'p-cantho', client: 'Kho lạnh Cần Thơ', value: 1.1e9, status: 'open', stage: 'survey', prob: 0.4, expectedOffset: 60 },
  { id: 'p-school', client: 'Trường quốc tế Long Biên', value: 0.65e9, status: 'open', stage: 'survey', prob: 0.3, expectedOffset: 75 },
  { id: 'p-thainguyen', client: 'Nhà máy điện tử Thái Nguyên', value: 1.8e9, status: 'won', stage: 'negotiation', prob: 1, expectedOffset: -10 },
  { id: 'p-danang', client: 'Khách sạn Đà Nẵng', value: 2.2e9, status: 'won', stage: 'quote', prob: 1, expectedOffset: -25 },
  { id: 'p-vungtau', client: 'Nhà máy bia Vũng Tàu', value: 1.7e9, status: 'lost', stage: 'negotiation', prob: 0, expectedOffset: -40 },
  { id: 'p-bvcantho', client: 'Bệnh viện Cần Thơ', value: 2.4e9, status: 'lost', stage: 'quote', prob: 0, expectedOffset: -55 },
  { id: 'p-bitexco', client: 'Tòa nhà Bitexco', value: 1.5e9, status: 'lost', stage: 'survey', prob: 0, expectedOffset: -70 },
];

export const TAX_ITEMS = [
  { id: 't-gtgt', label: 'Thuế GTGT quý 3', amount: 186e6, dueOffset: 5 },
  { id: 't-tncn', label: 'Thuế TNCN tháng 10', amount: 42e6, dueOffset: 10 },
  { id: 't-bhxh', label: 'BHXH & BHYT tháng 10', amount: 68e6, dueOffset: 10 },
];

export const CERTIFICATES = [
  { id: 'cert-tech', staffId: 'tech', staffName: 'Nguyễn Đức Huy', kind: 'Chứng chỉ hành nghề thiết kế PCCC', expiresOffset: 38 },
  { id: 'cert-tax', staffId: 'accounting-tax', staffName: 'Hoàng Anh Tuấn', kind: 'Chứng chỉ kế toán trưởng', expiresOffset: 25 },
  { id: 'cert-hr', staffId: 'hr', staffName: 'Trần Mai Anh', kind: 'Chứng nhận huấn luyện ATVSLĐ', expiresOffset: 120 },
  { id: 'cert-legal', staffId: 'hr-legal', staffName: 'Đỗ Minh Châu', kind: 'Thẻ hành nghề luật sư', expiresOffset: 210 },
  { id: 'cert-director', staffId: 'director', staffName: 'Phạm Quốc Bảo', kind: 'Chứng nhận huấn luyện PCCC', expiresOffset: 75 },
  { id: 'cert-sales', staffId: 'sales', staffName: 'Lê Thu Hà', kind: 'Chứng nhận tập huấn PCCC', expiresOffset: 95 },
];

export const DESIGN_FILES = [
  { id: 'd-fpt', project: 'FPT Hòa Lạc · IG-541', status: 'review', dueOffset: -2, revisions: 2 },
  { id: 'd-vsip', project: 'VSIP Bắc Ninh · Novec 1230', status: 'design', dueOffset: 4, revisions: 1 },
  { id: 'd-muongthanh', project: 'Mường Thanh Nha Trang · FM-200', status: 'asbuilt', dueOffset: -6, revisions: 3 },
  { id: 'd-dongnai', project: 'Bệnh viện Đồng Nai · IG-541', status: 'review', dueOffset: 9, revisions: 0 },
];

export const PLAYBOOK = {
  sales: {
    steps: [
      'Tiếp nhận khách hàng, khảo sát nhu cầu và hiện trường.',
      'Lập báo giá từ BOQ, xác nhận hiệu lực và điều khoản.',
      'Soạn hợp đồng, theo dõi ký và bàn giao hồ sơ cho Kỹ thuật.',
      'Chăm sóc sau bán, theo dõi công nợ và gia hạn bảo trì.',
    ],
    kpis: ['Giá trị pipeline', 'Tỷ lệ chốt', 'Hợp đồng ký mới', 'Công nợ phải thu'],
  },
  tech: {
    steps: [
      'Khảo sát hiện trường, xác nhận phạm vi bảo vệ.',
      'Thiết kế hệ thống khí, tính toán lượng khí theo tiêu chuẩn.',
      'Bóc tách BOQ và kiểm soát revision.',
      'Lập hồ sơ thẩm duyệt, hoàn công và hỗ trợ thi công.',
    ],
    kpis: ['Hồ sơ đang thiết kế', 'Tỷ lệ đúng hạn', 'Tỷ lệ sửa hồ sơ', 'Giá trị BOQ'],
  },
  hr: {
    steps: [
      'Quản lý hồ sơ nhân sự và hợp đồng lao động.',
      'Theo dõi chứng chỉ hành nghề PCCC và huấn luyện an toàn.',
      'BHXH, khám sức khỏe định kỳ và phúc lợi.',
      'Đề xuất ưu tiên pháp lý – nhân sự cho Giám đốc mỗi ngày.',
    ],
    kpis: ['Nhân sự', 'Chứng chỉ sắp hết hạn', 'Việc chờ duyệt', 'Văn bản pháp lý'],
  },
  accounting: {
    steps: [
      'Nhận chứng từ, hợp đồng đã ký và kiểm tra tính hợp lệ.',
      'Lập hóa đơn, theo dõi công nợ phải thu – phải trả.',
      'Kê khai, nộp thuế và các nghĩa vụ BHXH.',
      'Tính lương, quản trị dòng tiền và quyết toán dự án.',
    ],
    kpis: ['Phải thu', 'Quá hạn', 'Thuế đến hạn', 'Dòng tiền'],
  },
  director: {
    steps: [
      '09:00 nhận báo cáo điều hành và đề xuất ưu tiên.',
      'Duyệt báo giá, hợp đồng, đề xuất và hạn mức chi.',
      'Giao việc qua thư ký, theo dõi tiến độ từng phòng.',
      'Kiểm soát KPI, công nợ và rủi ro pháp lý.',
    ],
    kpis: ['Doanh thu', 'Tỷ lệ chốt', 'Công nợ quá hạn', 'Việc chờ duyệt'],
  },
};

export const OPERATING_CADENCE = [
  { when: 'Hằng ngày · 09:00', owner: 'AI Nhân sự → Giám đốc', text: 'Đề xuất ưu tiên, duyệt việc và cập nhật bảng tin phòng ban.' },
  { when: 'Thứ 2 hằng tuần', owner: 'Kinh doanh · Kế toán', text: 'Báo cáo pipeline, hợp đồng mới và công nợ phải thu.' },
  { when: '09:00 ngày cuối tháng', owner: 'Kế toán · Nhân sự', text: 'Thuế, BHXH, lương và KPI 5 phòng.' },
  { when: 'Hằng quý', owner: 'Nhân sự – Pháp chế', text: 'Rà soát chứng chỉ hành nghề, hồ sơ năng lực và nhà cung cấp.' },
];

const LAW_DOC_COUNT = Object.values(LAW_GROUPS).reduce((n, g) => n + g.docs.length, 0);

export function contractView(contract, now = new Date()) {
  const receivable = Math.max(0, contract.value - contract.paid);
  const dueAt = dayOffset(contract.dueOffset, now);
  const overdueDays = receivable > 0 ? Math.max(0, -daysUntil(dueAt, now)) : 0;
  let bucket = 'current';
  if (overdueDays > 60) bucket = 'd90';
  else if (overdueDays > 30) bucket = 'd60';
  else if (overdueDays > 0) bucket = 'd30';
  return { ...contract, receivable, dueAt, overdueDays, bucket };
}

export function getBusinessSnapshot(now = new Date()) {
  const contracts = CONTRACTS.map((c) => contractView(c, now));
  const signedValue = sumBy(contracts, 'value');
  const collected = sumBy(contracts, 'paid');
  const receivable = sumBy(contracts, 'receivable');
  const aging = { current: 0, d30: 0, d60: 0, d90: 0 };
  for (const c of contracts) aging[c.bucket] += c.receivable;
  const overdue = aging.d30 + aging.d60 + aging.d90;
  const overdueCount = contracts.filter((c) => c.overdueDays > 0).length;
  const activeReceivables = contracts.filter((c) => c.receivable > 0).length;

  const openOpps = PIPELINE.filter((o) => o.status === 'open');
  const wonOpps = PIPELINE.filter((o) => o.status === 'won');
  const lostOpps = PIPELINE.filter((o) => o.status === 'lost');
  const pipelineValue = sumBy(openOpps, 'value');
  const weightedPipeline = openOpps.reduce((n, o) => n + o.value * o.prob, 0);
  const closedCount = wonOpps.length + lostOpps.length;
  const winRate = closedCount ? wonOpps.length / closedCount : 0;

  const activeContracts = contracts.filter((c) => ACTIVE_STAGES.has(c.stage));
  const backlog = sumBy(activeContracts, 'value');

  const taxItems = TAX_ITEMS.map((t) => {
    const dueAt = dayOffset(t.dueOffset, now);
    return { ...t, dueAt, days: daysUntil(dueAt, now) };
  });
  const taxDue = sumBy(taxItems, 'amount');
  const taxNext = [...taxItems].sort((a, b) => a.days - b.days)[0] || null;

  const certificates = CERTIFICATES.map((c) => {
    const expiresAt = dayOffset(c.expiresOffset, now);
    return { ...c, expiresAt, days: daysUntil(expiresAt, now) };
  });
  const certExpiring = certificates
    .filter((c) => c.days >= 0 && c.days <= 45)
    .sort((a, b) => a.days - b.days);

  const designFiles = DESIGN_FILES.map((f) => {
    const dueAt = dayOffset(f.dueOffset, now);
    return { ...f, dueAt, days: daysUntil(dueAt, now) };
  });
  const designLate = designFiles.filter((f) => f.days < 0).sort((a, b) => a.days - b.days);

  return {
    contracts,
    signedValue,
    collected,
    receivable,
    activeReceivables,
    aging,
    overdue,
    overdueCount,
    pipelineValue,
    weightedPipeline,
    wonValue: sumBy(wonOpps, 'value'),
    winRate,
    wonCount: wonOpps.length,
    lostCount: lostOpps.length,
    backlog,
    avgContract: contracts.length ? signedValue / contracts.length : 0,
    taxItems,
    taxDue,
    taxNext,
    certificates,
    certExpiring,
    designFiles,
    designLate,
    cash: CASH_BALANCE,
  };
}

const LEVEL_ORDER = { urgent: 0, high: 1, medium: 2 };

export function getSampleAlerts(snapshot, live = {}, now = new Date()) {
  const alerts = [];

  if (snapshot.overdue > 0) {
    const worst = snapshot.contracts.reduce((n, c) => Math.max(n, c.overdueDays), 0);
    alerts.push({
      id: 'receivable-overdue',
      level: snapshot.aging.d90 > 0 ? 'urgent' : 'high',
      deptId: 'accounting',
      title: `Công nợ quá hạn ${fmtVnd(snapshot.overdue)}`,
      detail: `${snapshot.overdueCount} hợp đồng · nặng nhất ${worst} ngày`,
      meta: 'Kế toán · thu hồi công nợ',
    });
  }

  if (snapshot.taxNext && snapshot.taxNext.days <= 10) {
    const t = snapshot.taxNext;
    alerts.push({
      id: `tax-${t.id}`,
      level: t.days <= 7 ? 'high' : 'medium',
      deptId: 'accounting',
      title: `${t.label} đến hạn ${fmtShortDate(t.dueAt)}`,
      detail: `${fmtVnd(t.amount)} · ${fmtDue(t.dueAt, now)}`,
      meta: 'Kế toán thuế',
    });
  }

  for (const c of snapshot.certExpiring.slice(0, 2)) {
    alerts.push({
      id: `cert-${c.id}`,
      level: c.days <= 30 ? 'high' : 'medium',
      deptId: 'hr',
      title: `${c.staffName} · ${c.kind}`,
      detail: `hết hạn ${fmtShortDate(c.expiresAt)} · ${fmtDue(c.expiresAt, now)}`,
      meta: 'Nhân sự · gia hạn chứng chỉ',
    });
  }

  for (const f of snapshot.designLate.slice(0, 2)) {
    alerts.push({
      id: `design-${f.id}`,
      level: 'high',
      deptId: 'tech',
      title: `Hồ sơ thiết kế trễ: ${f.project}`,
      detail: `${fmtDue(f.dueAt, now)} · ${f.revisions} lần sửa`,
      meta: 'Kỹ thuật · bám tiến độ',
    });
  }

  const pending = Number(live.pendingApprovals) || 0;
  if (pending > 0) {
    alerts.push({
      id: 'pending-approvals',
      level: 'high',
      deptId: 'director',
      title: `${pending} đề xuất AI chờ Giám đốc duyệt`,
      detail: (live.pendingList || []).slice(0, 2).map((t) => t.title).join(' · '),
      meta: 'Giám đốc · duyệt tại thẻ phòng',
    });
  }

  return alerts.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

export function getDepartmentKpis(live = {}, now = new Date()) {
  const s = getBusinessSnapshot(now);
  const pending = Number(live.pendingApprovals) || 0;
  const staff = Number(live.staffTotal) || 8;
  const onTime = s.designFiles.length
    ? (s.designFiles.length - s.designLate.length) / s.designFiles.length
    : 1;
  const avgRevisions = s.designFiles.length
    ? s.designFiles.reduce((n, f) => n + f.revisions, 0) / s.designFiles.length
    : 0;

  return {
    sales: [
      { label: 'Pipeline', value: fmtVnd(s.pipelineValue), sample: true },
      { label: 'Tỷ lệ chốt', value: `${Math.round(s.winRate * 100)}%`, tone: s.winRate >= 0.35 ? 'ok' : 'warn', sample: true },
      { label: 'Hợp đồng ký', value: fmtVnd(s.signedValue), sample: true },
      { label: 'Công nợ', value: fmtVnd(s.receivable), sample: true },
    ],
    tech: [
      { label: 'Hồ sơ thiết kế', value: String(s.designFiles.length), sample: true },
      { label: 'Đúng hạn', value: `${Math.round(onTime * 100)}%`, tone: s.designLate.length ? 'warn' : 'ok', sample: true },
      { label: 'Hồ sơ trễ', value: String(s.designLate.length), tone: s.designLate.length ? 'bad' : 'ok', sample: true },
      { label: 'Revision TB', value: avgRevisions.toLocaleString('vi-VN', { maximumFractionDigits: 1 }), sample: true },
    ],
    hr: [
      { label: 'Nhân sự', value: String(staff) },
      { label: 'Chứng chỉ ≤45 ngày', value: String(s.certExpiring.length), tone: s.certExpiring.length ? 'warn' : 'ok', sample: true },
      { label: 'Chờ duyệt', value: String(pending), tone: pending ? 'warn' : 'ok' },
      { label: 'Văn bản pháp lý', value: String(LAW_DOC_COUNT) },
    ],
    accounting: [
      { label: 'Phải thu', value: fmtVnd(s.receivable), sample: true },
      { label: 'Quá hạn', value: fmtVnd(s.overdue), tone: s.overdue ? 'bad' : 'ok', sample: true },
      { label: 'Thuế đến hạn', value: fmtVnd(s.taxDue), tone: 'warn', sample: true },
      { label: 'Đã thu', value: fmtVnd(s.collected), sample: true },
    ],
    director: [
      { label: 'Hợp đồng ký', value: fmtVnd(s.signedValue), sample: true },
      { label: 'Tỷ lệ chốt', value: `${Math.round(s.winRate * 100)}%`, sample: true },
      { label: 'Công nợ quá hạn', value: fmtVnd(s.overdue), tone: s.overdue ? 'bad' : 'ok', sample: true },
      { label: 'Việc chờ duyệt', value: String(pending), tone: pending ? 'warn' : 'ok' },
    ],
  };
}

export function getDashboardModel(live = {}, now = new Date()) {
  const s = getBusinessSnapshot(now);
  const alerts = getSampleAlerts(s, live, now);
  const receivableBase = s.receivable || 1;
  const aging = [
    { key: 'current', label: 'Trong hạn', value: s.aging.current },
    { key: 'd30', label: 'Quá hạn 1–30 ngày', value: s.aging.d30 },
    { key: 'd60', label: 'Quá hạn 31–60 ngày', value: s.aging.d60 },
    { key: 'd90', label: 'Quá hạn trên 60 ngày', value: s.aging.d90 },
  ].map((row) => ({ ...row, pct: Math.min(100, Math.round((row.value / receivableBase) * 100)) }));

  return {
    asOf: now,
    sample: true,
    hero: [
      { label: 'Hợp đồng ký 2026', value: fmtVnd(s.signedValue), note: `${s.contracts.length} hợp đồng`, sample: true },
      { label: 'Đã thu', value: fmtVnd(s.collected), note: `${Math.round((s.collected / (s.signedValue || 1)) * 100)}% giá trị đã ký`, sample: true },
      { label: 'Phải thu', value: fmtVnd(s.receivable), note: `${s.activeReceivables} hợp đồng còn nợ`, sample: true },
      { label: 'Quá hạn', value: fmtVnd(s.overdue), note: `${s.overdueCount} hợp đồng · ${Math.round((s.overdue / receivableBase) * 100)}% phải thu`, tone: s.overdue ? 'bad' : 'ok', sample: true },
    ],
    sales: {
      rows: [
        { label: 'Pipeline đang mở', value: fmtVnd(s.pipelineValue), note: `${PIPELINE.filter((o) => o.status === 'open').length} cơ hội`, sample: true },
        { label: 'Pipeline có trọng số', value: fmtVnd(s.weightedPipeline), note: 'theo xác suất chốt', sample: true },
        { label: 'Tỷ lệ chốt', value: `${Math.round(s.winRate * 100)}%`, note: `${s.wonCount} thắng · ${s.lostCount} mất`, tone: s.winRate >= 0.35 ? 'ok' : 'warn', sample: true },
        { label: 'Backlog đang thực hiện', value: fmtVnd(s.backlog), note: `${s.contracts.filter((c) => ACTIVE_STAGES.has(c.stage)).length} hợp đồng`, sample: true },
      ],
    },
    finance: {
      aging,
      rows: [
        { label: 'Thuế & BHXH đến hạn', value: fmtVnd(s.taxDue), note: s.taxNext ? `${s.taxNext.label} · ${fmtDue(s.taxNext.dueAt, now)}` : 'không có khoản đến hạn', tone: 'warn', sample: true },
        { label: 'Số dư tiền mặt', value: fmtVnd(s.cash), note: 'đủ chi lương & thuế 3 tháng', sample: true },
      ],
    },
    ops: {
      rows: [
        { label: 'Hồ sơ hôm nay', value: String(Number(live.docsToday) || 0), note: 'hồ sơ nhận & hoàn tất hôm nay' },
        { label: 'Việc đang làm', value: String(Number(live.tasksOpen) || 0), note: `trên ${Number(live.staffTotal) || 8} nhân sự` },
        { label: 'Chờ Giám đốc duyệt', value: String(Number(live.pendingApprovals) || 0), note: 'đề xuất AI Nhân sự', tone: live.pendingApprovals ? 'warn' : 'ok' },
        { label: 'Hồ sơ thiết kế trễ', value: String(s.designLate.length), note: 'cần bổ sung/điều chỉnh', tone: s.designLate.length ? 'bad' : 'ok', sample: true },
        { label: 'Báo cáo 09:00 gần nhất', value: live.lastReportAt ? fmtTime(new Date(live.lastReportAt)) : 'Chưa gửi', note: live.lastReportAt ? 'AI Nhân sự → Giám đốc' : 'sẽ gửi tự động' },
      ],
      depts: live.deptRows || [],
    },
    people: {
      rows: [
        { label: 'Nhân sự đang làm việc', value: `${Number(live.staffTotal) || 8}/8`, note: 'định biên giai đoạn đầu' },
        { label: 'Chứng chỉ sắp hết hạn', value: String(s.certExpiring.length), note: s.certExpiring[0] ? `${s.certExpiring[0].staffName} · còn ${s.certExpiring[0].days} ngày` : 'trong 45 ngày tới', tone: s.certExpiring.length ? 'warn' : 'ok', sample: true },
        { label: 'Văn bản pháp lý áp dụng', value: String(LAW_DOC_COUNT), note: `${Object.keys(LAW_GROUPS).length} nhóm luật · cập nhật 2026` },
        { label: 'Huấn luyện an toàn', value: '8/8', note: 'còn hiệu lực theo kế hoạch quý', sample: true },
      ],
      certificates: s.certExpiring,
    },
    alerts,
    cadence: OPERATING_CADENCE,
  };
}

export function getDeptRoster() {
  return DEPARTMENTS.map((d) => ({ id: d.id, short: d.short, color: d.color }));
}
