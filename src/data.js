export const WORLD = {
  roomW: 12,
  roomD: 9.5,
  wallH: 1.5,
  backH: 3.0,
  corridorZ: -0.25,
};

export const ENTRY = { x: 0, z: 15.2 };

export const FLOW_ORDER = ['tech', 'sales', 'director', 'accounting'];

export const DEPARTMENTS = [
  {
    id: 'hr',
    name: 'Phòng Nhân sự',
    short: 'Nhân sự',
    tag: 'AI & Pháp chế Nhân sự',
    icon: '👥',
    color: '#0d9488',
    colorHex: 0x14b8a6,
    posX: -14.5,
    posZ: -9,
    staff: 'Trần Mai Anh',
    role: 'Chuyên viên Nhân sự',
    labelStaff: 'Nhân sự · Pháp chế',
    extraSide: 1,
    staffList: [
      {
        id: 'hr',
        name: 'Trần Mai Anh',
        role: 'Chuyên viên Nhân sự',
        scope: 'Luật nhân sự & lao động',
        lawGroup: 'nhanSu',
      },
      {
        id: 'hr-legal',
        name: 'Đỗ Minh Châu',
        role: 'Nhân viên Pháp chế',
        scope: 'Luật doanh nghiệp',
        lawGroup: 'doanhNghiep',
        screen: 'legal',
        look: { skin: '#f0c39b', hair: '#2f2a26', style: 'short' },
      },
    ],
    desc: 'Nhân sự phụ trách luật lao động và nghĩa vụ của doanh nghiệp với người lao động; Pháp chế phụ trách pháp luật doanh nghiệp. Trợ lý AI chọn 2 việc ưu tiên để Giám đốc xử lý mỗi ngày.',
    duties: ['Nghiên cứu luật lao động', 'Rà soát nghĩa vụ doanh nghiệp', 'Đề xuất 2 việc mỗi ngày'],
    work: 'Rà soát điều kiện pháp lý & hợp đồng lao động cho dự án',
    done: 'Hồ sơ pháp lý đã hoàn tất',
  },
  {
    id: 'tech',
    name: 'Phòng Kỹ thuật',
    short: 'Kỹ thuật',
    tag: 'Thiết kế & BOQ',
    icon: '📐',
    color: '#2563eb',
    colorHex: 0x3b82f6,
    posX: 14.5,
    posZ: -9,
    staff: 'Nguyễn Đức Huy',
    role: 'Kỹ sư thiết kế PCCC',
    desc: 'Thiết kế hệ thống phòng cháy chữa cháy và bóc tách khối lượng BOQ theo tiêu chuẩn, quy chuẩn hiện hành.',
    duties: ['Thiết kế hệ thống PCCC', 'Bóc tách khối lượng BOQ', 'Kiểm tra kỹ thuật'],
    work: 'Thiết kế hệ thống PCCC & lập khối lượng BOQ',
    done: 'Bản vẽ & BOQ hoàn chỉnh',
  },
  {
    id: 'sales',
    name: 'Phòng Kinh doanh',
    short: 'Kinh doanh',
    tag: 'Báo giá & Hợp đồng',
    icon: '💼',
    color: '#d97706',
    colorHex: 0xf59e0b,
    posX: -14.5,
    posZ: 8.5,
    staff: 'Lê Thu Hà',
    role: 'Chuyên viên Kinh doanh',
    desc: 'Lập báo giá từ khối lượng BOQ, soạn thảo hợp đồng và làm việc trực tiếp với khách hàng.',
    duties: ['Lập báo giá', 'Soạn thảo hợp đồng', 'Chăm sóc khách hàng'],
    work: 'Lập báo giá & soạn hợp đồng gửi khách hàng',
    done: 'Báo giá & hợp đồng đã gửi khách',
  },
  {
    id: 'director',
    name: 'Phòng Giám đốc',
    short: 'Giám đốc',
    tag: 'Phê duyệt & Điều hành',
    icon: '👔',
    color: '#be123c',
    colorHex: 0xe11d48,
    posX: 0,
    posZ: -9,
    staff: 'Phạm Quốc Bảo',
    role: 'Giám đốc điều hành',
    desc: 'Phê duyệt báo giá, hợp đồng và nắm toàn bộ thông tin vận hành, tài chính của công ty.',
    duties: ['Phê duyệt báo giá', 'Ký hợp đồng', 'Tổng hợp báo cáo'],
    work: 'Thẩm định, phê duyệt báo giá & hợp đồng',
    done: 'Đã phê duyệt & ký số',
  },
  {
    id: 'accounting',
    name: 'Phòng Kế toán',
    short: 'Kế toán',
    tag: 'Tài chính & Thuế',
    icon: '📊',
    color: '#7c3aed',
    colorHex: 0x8b5cf6,
    posX: 14.5,
    posZ: 8.5,
    staff: 'Vũ Khánh Linh',
    role: 'Kế toán nội bộ',
    labelStaff: 'Kế toán nội bộ · Kế toán thuế',
    extraSide: -1,
    staffList: [
      {
        id: 'accounting',
        name: 'Vũ Khánh Linh',
        role: 'Kế toán nội bộ',
        scope: 'Tổng hợp & lưu trữ nội bộ',
        lawGroup: null,
      },
      {
        id: 'accounting-tax',
        name: 'Hoàng Anh Tuấn',
        role: 'Kế toán thuế',
        scope: 'Kế toán & thuế',
        lawGroup: 'keToanThue',
        screen: 'tax',
        look: { skin: '#d9a06b', hair: '#3b2a21', style: 'side', tie: true },
      },
    ],
    desc: 'Kế toán nội bộ tổng hợp báo giá, hợp đồng đã ký, công nợ và lưu trữ hồ sơ; kế toán thuế quản lý hóa đơn, kê khai và nộp thuế.',
    duties: ['Tổng hợp chứng từ', 'Theo dõi công nợ', 'Kê khai & nộp thuế'],
    work: 'Tổng hợp báo giá, hợp đồng đã ký & công nợ',
    done: 'Hồ sơ tài chính đã lưu trữ',
  },
];

export const DEPT_MAP = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));

export const DEPT_SCREENS = {
  hr: 'org',
  tech: 'cad',
  sales: 'chart',
  director: 'dash',
  accounting: 'ledger',
};

export const HIRE_LOOKS = [
  { skin: '#e6b489', hair: '#1f2937', style: 'short' },
  { skin: '#f0c39b', hair: '#3b2a21', style: 'long' },
  { skin: '#d9a06b', hair: '#2f2a26', style: 'side' },
  { skin: '#f2c9a0', hair: '#4a3728', style: 'bun' },
];

export const LAW_GROUPS = {
  doanhNghiep: {
    label: 'Pháp luật về Doanh nghiệp',
    note: 'Cấu trúc vốn, quyền hạn người đại diện, trình tự họp hội đồng thành viên/hội đồng quản trị và thủ tục hành chính chung.',
    docs: [
      { code: 'Luật Doanh nghiệp 2020', ref: '59/2020/QH14', note: 'Đạo luật gốc: thành lập, tổ chức quản lý và giải thể doanh nghiệp.' },
      { code: 'Nghị định 01/2021/NĐ-CP', note: 'Thủ tục đăng ký doanh nghiệp, thay đổi nội dung đăng ký kinh doanh (vốn, ngành nghề, người đại diện).' },
      { code: 'Nghị định 47/2021/NĐ-CP', note: 'Hướng dẫn Luật Doanh nghiệp về con dấu, chi nhánh, văn phòng đại diện.' },
    ],
  },
  keToanThue: {
    label: 'Pháp luật về Kế toán & Thuế',
    note: 'Hạch toán giá vốn, doanh thu, lợi nhuận và nghĩa vụ nộp ngân sách nhà nước.',
    docs: [
      { code: 'Luật Kế toán 2015', ref: '88/2015/QH13', note: 'Chứng từ, sổ sách, báo cáo tài chính và tiêu chuẩn Kế toán trưởng.' },
      { code: 'Thông tư 133/2016 & 200/2014/TT-BTC', note: 'Chế độ kế toán doanh nghiệp nhỏ và vừa / doanh nghiệp lớn.' },
      { code: 'Luật Quản lý thuế 2019', ref: '38/2019/QH14', note: 'Thời hạn khai thuế, nộp thuế, xử lý nợ đọng và hoàn thuế.' },
      { code: 'Nghị định 123/2020 & TT 78/2021', note: 'Hóa đơn, chứng từ điện tử: thời điểm lập hóa đơn, hóa đơn tạm ứng.' },
      { code: 'Luật thuế GTGT · TNDN · TNCN', note: 'Căn cứ tính thuế và các nghị định hướng dẫn chi tiết.' },
    ],
  },
  nhanSu: {
    label: 'Pháp luật về Nhân sự & Lao động',
    note: 'Tuyển dụng, tính lương, đóng bảo hiểm và giải quyết tranh chấp lao động.',
    docs: [
      { code: 'Bộ luật Lao động 2019', ref: '45/2019/QH14', note: 'Hợp đồng lao động, thử việc, giờ làm việc, nghỉ phép năm và kỷ luật sa thải.' },
      { code: 'Luật Bảo hiểm xã hội 2024', ref: '41/2024/QH15', note: 'Hiệu lực 01/7/2025: ốm đau, thai sản, hưu trí và mức đóng bắt buộc.' },
      { code: 'Luật Việc làm 2013', note: 'Đóng và hưởng trợ cấp bảo hiểm thất nghiệp.' },
      { code: 'Luật An toàn, vệ sinh lao động 2015', note: 'Khám sức khỏe định kỳ, bảo đảm an toàn phòng chống tai nạn tại nơi làm việc.' },
    ],
  },
};
