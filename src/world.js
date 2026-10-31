import * as THREE from '../vendor/three.module.js';
import { DEPARTMENTS, WORLD, ENTRY, DEPT_SCREENS, HIRE_LOOKS } from './data.js';

export const FLOOR_Y = 0.1;

const SEAT_DROP = -0.09;
const MAX_STAFF = 3;
const DETAIL_SCALE = 1.12;

const WHITE = new THREE.Color(0xffffff);

// ---------------------------------------------------------------- textures

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function floorTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#eef2f8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(148,163,184,0.20)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  });
}

function glowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function labelTexture(d) {
  return canvasTexture(768, 192, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    roundRectPath(ctx, 6, 6, w - 12, h - 12, 42);
    ctx.fill();
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(78, h / 2, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 40px "Segoe UI", "Helvetica Neue", sans-serif';
    ctx.fillText(d.name, 126, h / 2 - 20);
    ctx.fillStyle = 'rgba(203,213,225,0.82)';
    ctx.font = '500 29px "Segoe UI", "Helvetica Neue", sans-serif';
    ctx.fillText(d.labelStaff || d.staff, 126, h / 2 + 28);
    ctx.textAlign = 'right';
    ctx.font = '62px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.fillText(d.icon, w - 56, h / 2 + 2);
    ctx.textAlign = 'left';
  });
}

function staffTagTexture(name, role, color) {
  return canvasTexture(512, 140, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(15,23,42,0.92)';
    roundRectPath(ctx, 4, 4, w - 8, h - 8, 34);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(48, h / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 33px "Segoe UI", "Helvetica Neue", sans-serif';
    ctx.fillText(name, 76, h / 2 - 17, w - 96);
    ctx.fillStyle = 'rgba(203,213,225,0.85)';
    ctx.font = '500 24px "Segoe UI", "Helvetica Neue", sans-serif';
    ctx.fillText(role, 76, h / 2 + 21, w - 96);
  });
}

function posterTexture(d) {
  return canvasTexture(768, 192, (ctx, w, h) => {
    ctx.fillStyle = '#101a2e';
    roundRectPath(ctx, 0, 0, w, h, 18);
    ctx.fill();
    ctx.fillStyle = d.color;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = d.color;
    ctx.fillRect(0, 0, 10, h);
    ctx.font = '74px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.icon, 40, h / 2 + 4);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 46px "Segoe UI", sans-serif';
    ctx.fillText(d.name.replace('Phòng ', '').toUpperCase(), 136, h / 2 - 22);
    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = '500 28px "Segoe UI", sans-serif';
    ctx.fillText(d.tag, 138, h / 2 + 32);
  });
}

function screenTexture(kind, color) {
  return canvasTexture(320, 200, (ctx, w, h) => {
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, 0, w, 26);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 4, h);

    ctx.fillStyle = 'rgba(226,232,240,0.92)';
    ctx.font = '600 11px "Segoe UI", sans-serif';
    const title =
      kind === 'cad' ? 'BẢN VẼ PCCC' :
      kind === 'chart' ? 'BÁO GIÁ DỰ ÁN' :
      kind === 'ledger' ? 'SỔ TỔNG HỢP' :
      kind === 'org' ? 'HỒ SƠ NHÂN SỰ' :
      kind === 'legal' ? 'VĂN BẢN PHÁP CHẾ' :
      kind === 'tax' ? 'SỔ THUẾ & HÓA ĐƠN' :
      kind === 'ai' ? 'AI NHÂN SỰ' : 'BẢNG ĐIỀU HÀNH';
    ctx.fillText(title, 14, 17);

    if (kind === 'cad') {
      ctx.strokeStyle = 'rgba(56,189,248,0.16)';
      ctx.lineWidth = 1;
      for (let x = 16; x < w; x += 22) {
        ctx.beginPath(); ctx.moveTo(x, 36); ctx.lineTo(x, h - 12); ctx.stroke();
      }
      for (let y = 36; y < h; y += 22) {
        ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(w - 14, y); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(125,211,252,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 62, 120, 78);
      ctx.strokeRect(168, 48, 92, 120);
      ctx.beginPath(); ctx.moveTo(48, 140); ctx.lineTo(260, 140); ctx.lineTo(260, 100); ctx.stroke();
      ctx.fillStyle = 'rgba(56,189,248,0.9)';
      [[60, 74], [80, 74], [120, 74]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); });
      ctx.fillStyle = 'rgba(226,232,240,0.5)';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('TẦNG 03 · PCCC', 48, 178);
    } else if (kind === 'chart') {
      ctx.strokeStyle = 'rgba(148,163,184,0.25)';
      ctx.lineWidth = 1;
      for (let y = 54; y < 150; y += 24) {
        ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(w - 20, y); ctx.stroke();
      }
      const bars = [26, 48, 38, 70, 58, 88, 76];
      bars.forEach((bh, i) => {
        ctx.fillStyle = i === bars.length - 1 ? color : 'rgba(148,163,184,0.55)';
        ctx.fillRect(28 + i * 38, 154 - bh * 1.1, 22, bh * 1.1);
      });
      ctx.fillStyle = 'rgba(226,232,240,0.6)';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('Q1   Q2   Q3   Q4', 30, 182);
    } else if (kind === 'ledger') {
      const rows = [1, 2, 3, 4];
      rows.forEach((r) => {
        ctx.fillStyle = r % 2 ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.03)';
        ctx.fillRect(14, 32 + r * 26, w - 28, 20);
        ctx.fillStyle = 'rgba(226,232,240,0.75)';
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.fillText('HD-2026-' + (120 + r), 22, 46 + r * 26);
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.fillRect(w - 108, 40 + r * 26, 56, 5);
        ctx.fillStyle = color;
        ctx.fillRect(w - 44, 40 + r * 26, 24, 5);
      });
      ctx.fillStyle = 'rgba(226,232,240,0.4)';
      ctx.fillRect(14, 166, 120, 6);
    } else if (kind === 'ai') {
      const rows = ['Hợp đồng lao động', 'Đóng BHXH tháng này', 'Điều kiện kinh doanh PCCC'];
      rows.forEach((label, i) => {
        const y = 38 + i * 44;
        ctx.fillStyle = 'rgba(20,184,166,0.13)';
        roundRectPath(ctx, 16, y, w - 32, 36, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,184,166,0.45)';
        ctx.lineWidth = 1.2;
        roundRectPath(ctx, 16, y, w - 32, 36, 8);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(36, y + 18, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(32, y + 18);
        ctx.lineTo(35, y + 22);
        ctx.lineTo(41, y + 14);
        ctx.stroke();
        ctx.fillStyle = 'rgba(226,232,240,0.85)';
        ctx.font = '600 11px "Segoe UI", sans-serif';
        ctx.fillText(label, 54, y + 22);
      });
      ctx.fillStyle = 'rgba(153,246,228,0.65)';
      ctx.font = '600 9px "Segoe UI", sans-serif';
      ctx.fillText('4 VIỆC ƯU TIÊN HÔM NAY', 16, 188);
    } else if (kind === 'legal') {
      const docs = ['Điều lệ & nghị quyết', 'Đăng ký doanh nghiệp'];
      docs.forEach((label, i) => {
        const y = 40 + i * 48;
        ctx.fillStyle = 'rgba(148,163,184,0.12)';
        roundRectPath(ctx, 16, y, w - 32, 38, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(226,232,240,0.85)';
        ctx.font = '600 11px "Segoe UI", sans-serif';
        ctx.fillText(label, 30, y + 24);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(w - 44, y + 19, 9, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(248,113,113,0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(84, 164, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(248,113,113,0.8)';
      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillText('ĐÃ RÀ SOÁT', 52, 167);
      ctx.fillStyle = 'rgba(148,163,184,0.55)';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('HỒ SƠ PHÁP LÝ DOANH NGHIỆP', 118, 168);
    } else if (kind === 'tax') {
      const rows = [['Thuế GTGT', '10%'], ['Thuế TNDN', '20%'], ['Thuế TNCN', 'Lũy tiến']];
      rows.forEach(([label, val], i) => {
        const y = 40 + i * 38;
        ctx.fillStyle = i % 2 ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.12)';
        ctx.fillRect(16, y, w - 32, 30);
        ctx.fillStyle = 'rgba(226,232,240,0.85)';
        ctx.font = '600 11px "Segoe UI", sans-serif';
        ctx.fillText(label, 28, y + 20);
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.fillText(val, w - 28, y + 20);
        ctx.textAlign = 'left';
      });
      ctx.fillStyle = 'rgba(153,246,228,0.6)';
      ctx.font = '600 9px "Segoe UI", sans-serif';
      ctx.fillText('KÊ KHAI THÁNG 10/2026', 16, 186);
    } else if (kind === 'org') {
      ctx.strokeStyle = 'rgba(148,163,184,0.5)';
      ctx.lineWidth = 1.5;
      const nodes = [[60, 60], [60, 118], [160, 88], [250, 60], [250, 118]];
      ctx.beginPath();
      ctx.moveTo(74, 60); ctx.lineTo(146, 88);
      ctx.moveTo(74, 118); ctx.lineTo(146, 88);
      ctx.moveTo(174, 88); ctx.lineTo(236, 60);
      ctx.moveTo(174, 88); ctx.lineTo(236, 118);
      ctx.stroke();
      nodes.forEach(([x, y], i) => {
        ctx.fillStyle = i === 2 ? color : 'rgba(148,163,184,0.55)';
        ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(226,232,240,0.5)';
        ctx.fillRect(x - 14, y + 18, 28, 4);
      });
    } else {
      ctx.fillStyle = 'rgba(148,163,184,0.14)';
      ctx.fillRect(18, 42, 128, 62);
      ctx.fillRect(158, 42, 144, 62);
      ctx.fillRect(18, 116, 284, 62);
      ctx.fillStyle = color;
      ctx.font = '700 22px "Segoe UI", sans-serif';
      ctx.fillText('98%', 32, 82);
      ctx.fillStyle = 'rgba(226,232,240,0.85)';
      ctx.fillText('12', 174, 82);
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('TỶ LỆ DUYỆT', 32, 96);
      ctx.fillText('HỒ SƠ THÁNG', 174, 96);
      ctx.strokeStyle = 'rgba(148,163,184,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const x = 30 + i * 22;
        const y = 160 - Math.sin(i * 0.9) * 18 - i * 1.6;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

function blueprintTexture() {
  return canvasTexture(512, 384, (ctx, w, h) => {
    ctx.fillStyle = '#0b2a4a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(56,189,248,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(186,230,253,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 80, 220, 180);
    ctx.strokeRect(290, 130, 140, 170);
    ctx.strokeStyle = 'rgba(56,189,248,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(180, 170, 44, 0, Math.PI * 2);
    ctx.moveTo(180, 170); ctx.lineTo(180, 126);
    ctx.stroke();
    ctx.fillStyle = 'rgba(186,230,253,0.8)';
    ctx.font = '600 16px "Segoe UI", sans-serif';
    ctx.fillText('HỆ THỐNG SPRINKLER · TẦNG 3', 70, 60);
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(125,211,252,0.6)';
    ctx.fillText('TỶ LỆ 1:100 · REV.02', 70, 330);
  });
}

function boardTexture(color) {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 24px "Segoe UI", sans-serif';
    ctx.fillText('KẾ HOẠCH DOANH THU QUÝ', 28, 44);
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 260); ctx.lineTo(w - 30, 260); ctx.stroke();
    const bars = [70, 110, 90, 150, 130, 180];
    bars.forEach((bh, i) => {
      ctx.fillStyle = i % 2 ? color : 'rgba(15,23,42,0.75)';
      ctx.fillRect(52 + i * 68, 250 - bh, 40, bh);
      ctx.fillStyle = 'rgba(100,116,139,0.9)';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('T' + (i + 1), 62 + i * 68, 284);
    });
  });
}

function signTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(15,23,42,0.94)';
    roundRectPath(ctx, 4, 4, w - 8, h - 8, 40);
    ctx.fill();
    ctx.fillStyle = '#e11d48';
    roundRectPath(ctx, 40, 60, 136, 136, 30);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 52px "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('TTS', 108, 132);
    ctx.textAlign = 'left';
    ctx.font = '700 76px "Segoe UI", sans-serif';
    ctx.fillText('TTS.Co', 212, 116);
    ctx.fillStyle = 'rgba(203,213,225,0.82)';
    ctx.font = '400 30px "Segoe UI", sans-serif';
    ctx.fillText('TƯ VẤN · THIẾT KẾ · THI CÔNG PCCC', 214, 176);
  });
}

function aiHoloTexture() {
  return canvasTexture(512, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(4,47,44,0.78)';
    roundRectPath(ctx, 6, 6, w - 12, h - 12, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(94,234,212,0.8)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 6, 6, w - 12, h - 12, 26);
    ctx.stroke();

    ctx.fillStyle = '#5eead4';
    ctx.beginPath();
    const sx = 66;
    const sy = 66;
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 4;
      const r = i % 2 ? 7 : 24;
      const x = sx + Math.cos(a) * r;
      const y = sy + Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ccfbf1';
    ctx.font = '800 40px "Segoe UI", sans-serif';
    ctx.fillText('AI NHÂN SỰ', 112, 66);
    ctx.fillStyle = 'rgba(153,246,228,0.92)';
    ctx.font = '600 19px "Segoe UI", sans-serif';
    ctx.fillText('4 việc ưu tiên · báo cáo 09:00', 112, 108);
    ctx.fillStyle = 'rgba(94,234,212,0.16)';
    ctx.fillRect(28, 130, w - 56, 3);
  });
}

function notifTexture(count) {
  return canvasTexture(320, 144, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(15,23,42,0.95)';
    roundRectPath(ctx, 4, 4, w - 8, h - 8, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(225,29,72,0.85)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 4, 4, w - 8, h - 8, 32);
    ctx.stroke();
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(58, 72, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '38px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔔', 58, 74);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 40px "Segoe UI", sans-serif';
    ctx.fillText(`${count} tin mới`, 106, 64);
    ctx.fillStyle = 'rgba(203,213,225,0.78)';
    ctx.font = '500 24px "Segoe UI", sans-serif';
    ctx.fillText('Bấm phòng để xem', 106, 100);
  });
}

const notifTextures = new Map();

function getNotifTexture(count) {
  const key = Math.min(9, Math.max(1, count));
  if (!notifTextures.has(key)) notifTextures.set(key, notifTexture(key));
  return notifTextures.get(key);
}


function clientTexture() {
  return canvasTexture(512, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    roundRectPath(ctx, 4, 4, w - 8, h - 8, 34);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(62, h / 2, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 38px "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('Khách hàng', 100, h / 2 - 2);
  });
}

// ---------------------------------------------------------------- materials

let M;

function initMaterials() {
  M = {
    wall: new THREE.MeshStandardMaterial({ color: 0xf5f7fc, roughness: 0.92 }),
    slab: new THREE.MeshStandardMaterial({ color: 0xdde6f2, roughness: 0.95 }),
    white: new THREE.MeshStandardMaterial({ color: 0xfafbfe, roughness: 0.7 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xc9a27b, roughness: 0.72 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x9b7a56, roughness: 0.78 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9aa8ba, metalness: 0.55, roughness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }),
    chair: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 }),
    chairExec: new THREE.MeshStandardMaterial({ color: 0x243247, roughness: 0.8 }),
    keyboard: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 }),
    screenBody: new THREE.MeshStandardMaterial({ color: 0x273449, roughness: 0.55 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
    pot: new THREE.MeshStandardMaterial({ color: 0xe7edf5, roughness: 0.8 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x4b3626, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x4d9e63, roughness: 0.9 }),
    leaf2: new THREE.MeshStandardMaterial({ color: 0x3f8b55, roughness: 0.9 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd9b25e, metalness: 0.7, roughness: 0.3 }),
    cardboard: new THREE.MeshStandardMaterial({ color: 0xd8c3a1, roughness: 0.95 }),
    cabinet: new THREE.MeshStandardMaterial({ color: 0xd7dee9, roughness: 0.75 }),
    red: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.7 }),
    pants: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }),
    shoe: new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xbfd9ee, transparent: true, opacity: 0.26, roughness: 0.12, metalness: 0.15, depthWrite: false,
    }),
  };
}

function tintMat(colorHex, mix = 0.8) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex).lerp(WHITE, mix),
    roughness: 0.9,
  });
}

// ---------------------------------------------------------------- primitives

function box(parent, w, h, d, mat, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (opts.rotY) m.rotation.y = opts.rotY;
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  parent.add(m);
  return m;
}

function cyl(parent, rt, rb, h, seg, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function dashedFloorLine(points, color = 0x94a3b8, opacity = 0.45) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineDashedMaterial({
    color, dashSize: 0.42, gapSize: 0.34, transparent: true, opacity, depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.renderOrder = 2;
  return line;
}

// ---------------------------------------------------------------- environment

function addGround(scene) {
  const slab = new THREE.Mesh(new THREE.BoxGeometry(40, 0.6, 26), M.slab);
  slab.position.set(0, -0.3, -2.2);
  slab.receiveShadow = true;
  slab.castShadow = true;
  scene.add(slab);

  const tex = floorTexture();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 8);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 26),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.004, -2.2);
  floor.receiveShadow = true;
  scene.add(floor);
}

function addLights(scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd7e1ef, 1.3);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff5e8, 2.5);
  sun.position.set(19, 31, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -34;
  sun.shadow.camera.right = 34;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 90;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xdbe7ff, 0.7);
  fill.position.set(-24, 16, -20);
  scene.add(fill);
}

// ---------------------------------------------------------------- furniture

function addDesk(parent, x, z, w = 3.2, d = 1.5) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.scale.setScalar(DETAIL_SCALE);
  parent.add(g);
  box(g, w, 0.08, d, M.white, 0, 0.74, 0);
  box(g, w - 0.4, 0.36, 0.06, tintMat(0x94a3b8, 0.55), 0, 0.52, -d / 2 + 0.14);
  const lx = w / 2 - 0.14;
  const lz = d / 2 - 0.14;
  box(g, 0.08, 0.72, 0.08, M.wood, -lx, 0.36, -lz);
  box(g, 0.08, 0.72, 0.08, M.wood, lx, 0.36, -lz);
  box(g, 0.08, 0.72, 0.08, M.wood, -lx, 0.36, lz);
  box(g, 0.08, 0.72, 0.08, M.wood, lx, 0.36, lz);
  return g;
}

function addMonitor(parent, x, z, opts = {}) {
  const { kind = 'dash', color = '#3b82f6', rotY = 0, w = 0.98, h = 0.58 } = opts;
  const g = new THREE.Group();
  g.position.set(x, 0.78, z);
  g.rotation.y = rotY;
  parent.add(g);

  cyl(g, 0.15, 0.18, 0.025, 18, M.metal, 0, 0.013, 0);
  box(g, 0.06, 0.25, 0.06, M.metal, 0, 0.14, 0);

  const tex = screenTexture(kind, color);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.5,
    roughness: 0.45,
  });
  box(g, w, h, 0.055, M.screenBody, 0, 0.28 + h / 2, 0);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), mat);
  screen.position.set(0, 0.28 + h / 2, 0.031);
  g.add(screen);
  return mat;
}

function addLaptop(parent, x, z, kind, color, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0.78, z);
  g.rotation.y = rotY;
  parent.add(g);
  box(g, 0.58, 0.03, 0.4, M.metal, 0, 0.015, 0);
  box(g, 0.5, 0.005, 0.24, M.keyboard, 0, 0.032, 0.03, { cast: false });
  const lid = new THREE.Group();
  lid.position.set(0, 0.02, -0.19);
  lid.rotation.x = -0.32;
  g.add(lid);
  box(lid, 0.58, 0.38, 0.02, M.screenBody, 0, 0.19, 0);
  const tex = screenTexture(kind, color);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.33),
    new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.45 })
  );
  screen.position.set(0, 0.19, 0.012);
  screen.rotation.y = Math.PI;
  lid.add(screen);
  return g;
}

function addChair(parent, x, z, rotY = 0, exec = false) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.rotation.y = rotY;
  g.scale.setScalar(DETAIL_SCALE * (exec ? 1.08 : 1));
  parent.add(g);
  const mat = exec ? M.chairExec : M.chair;
  cyl(g, 0.36, 0.4, 0.05, 18, M.metal, 0, 0.06, 0);
  cyl(g, 0.05, 0.05, 0.36, 10, M.metal, 0, 0.24, 0);
  box(g, 0.84, 0.1, 0.82, mat, 0, 0.45, 0);
  box(g, 0.82, exec ? 0.92 : 0.7, 0.09, mat, 0, exec ? 0.92 : 0.82, -0.38);
  return g;
}

function addShelf(parent, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.rotation.y = rotY;
  g.scale.setScalar(DETAIL_SCALE);
  parent.add(g);
  box(g, 1.9, 0.07, 0.42, M.woodDark, 0, 1.98, 0);
  box(g, 1.9, 0.09, 0.42, M.woodDark, 0, 0.12, 0);
  box(g, 0.08, 1.92, 0.42, M.woodDark, -0.95, 1.05, 0);
  box(g, 0.08, 1.92, 0.42, M.woodDark, 0.95, 1.05, 0);
  for (let i = 0; i < 3; i++) box(g, 1.82, 0.05, 0.38, M.woodDark, 0, 0.55 + i * 0.56, 0);

  const bookColors = [0x0d9488, 0x2563eb, 0xd97706, 0xbe123c, 0x7c3aed, 0x475569, 0x0f766e];
  for (let i = 0; i < 15; i++) {
    const bw = 0.09 + ((i * 7) % 5) * 0.025;
    const bh = 0.28 + ((i * 13) % 6) * 0.03;
    const shelf = i % 3;
    const bx = -0.78 + (i % 7) * 0.24;
    const mat = new THREE.MeshStandardMaterial({ color: bookColors[i % bookColors.length], roughness: 0.85 });
    box(g, bw, bh, 0.28, mat, bx, 0.55 + shelf * 0.56 + bh / 2 + 0.03, 0.02, { cast: false });
  }
  return g;
}

let plantSink = null;

function addPlant(parent, x, z, s = 1) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.scale.setScalar(s * 1.1);
  parent.add(g);
  cyl(g, 0.25, 0.3, 0.4, 14, M.pot, 0, 0.2, 0);
  cyl(g, 0.24, 0.24, 0.03, 14, M.soil, 0, 0.4, 0);
  cyl(g, 0.025, 0.03, 0.62, 6, M.leaf2, 0, 0.66, 0);

  const blob = (r, px, py, pz, mat) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat);
    m.position.set(px, py, pz);
    m.castShadow = true;
    g.add(m);
  };
  blob(0.3, 0, 1.02, 0, M.leaf);
  blob(0.22, 0.22, 0.88, 0.06, M.leaf2);
  blob(0.2, -0.2, 1.12, -0.04, M.leaf2);

  const ref = { group: g, phase: Math.random() * Math.PI * 2 };
  if (plantSink) plantSink.push(ref);
  return ref;
}

function addFilingCabinet(parent, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.rotation.y = rotY;
  g.scale.setScalar(DETAIL_SCALE);
  parent.add(g);
  box(g, 0.95, 1.5, 0.55, M.cabinet, 0, 0.75, 0);
  for (let i = 0; i < 3; i++) {
    box(g, 0.82, 0.02, 0.02, M.metal, 0, 0.4 + i * 0.4, 0.28, { cast: false });
    box(g, 0.24, 0.045, 0.03, M.metal, 0, 0.55 + i * 0.4, 0.29, { cast: false });
  }
  return g;
}

function addPaperStack(parent, x, z, n = 3, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0.78, z);
  g.rotation.y = rotY;
  parent.add(g);
  for (let i = 0; i < n; i++) {
    box(g, 0.42, 0.012, 0.3, M.paper, 0, 0.008 + i * 0.014, 0, {
      cast: false,
      rotY: (i % 2 ? 1 : -1) * 0.06 * i,
    });
  }
  return g;
}

function addWhiteboard(parent, x, z, rotY, color) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.rotation.y = rotY;
  g.scale.setScalar(DETAIL_SCALE);
  parent.add(g);
  box(g, 2.3, 1.35, 0.06, M.screenBody, 0, 1.42, 0);
  const tex = boardTexture(color);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.14, 1.2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 })
  );
  face.position.set(0, 1.42, 0.035);
  g.add(face);
  box(g, 0.06, 1.24, 0.06, M.metal, -0.9, 0.6, 0.16);
  box(g, 0.06, 1.24, 0.06, M.metal, 0.9, 0.6, 0.16);
  box(g, 1.9, 0.05, 0.06, M.metal, 0, 0.05, 0.16);
  return g;
}

function addArmchair(parent, x, z, rotY, color) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.rotation.y = rotY;
  g.scale.setScalar(DETAIL_SCALE);
  parent.add(g);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  box(g, 0.95, 0.32, 0.9, mat, 0, 0.36, 0);
  box(g, 0.95, 0.6, 0.16, mat, 0, 0.62, -0.37);
  box(g, 0.16, 0.3, 0.84, mat, -0.42, 0.5, 0);
  box(g, 0.16, 0.3, 0.84, mat, 0.42, 0.5, 0);
  return g;
}

function addGuestChair(parent, x, z, rotY) {
  return addChair(parent, x, z, rotY);
}

function addTubeBundle(parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, FLOOR_Y, z);
  g.scale.setScalar(DETAIL_SCALE);
  parent.add(g);
  const heights = [1.55, 1.4, 1.65, 1.3, 1.5];
  heights.forEach((h, i) => {
    const m = cyl(g, 0.085, 0.085, h, 12, i % 2 ? M.cardboard : M.paper, (i % 3) * 0.2 - 0.2, h / 2, Math.floor(i / 3) * 0.2);
    m.rotation.z = (i % 3 - 1) * 0.03;
  });
  return g;
}

// ---------------------------------------------------------------- people

function createPerson({ shirt, skin, hair, style = 'short', tie = false }) {
  const g = new THREE.Group();
  g.scale.setScalar(DETAIL_SCALE);
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.85 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.9 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.75 });

  const lap = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), shirtMat);
  lap.scale.set(1, 0.55, 0.8);
  lap.position.y = 0.56;
  lap.castShadow = true;
  g.add(lap);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.235, 0.34, 6, 18), shirtMat);
  torso.position.y = 0.87;
  torso.castShadow = true;
  g.add(torso);

  cyl(g, 0.075, 0.085, 0.12, 10, skinMat, 0, 1.17, 0);

  const head = new THREE.Group();
  head.position.y = 1.31;
  g.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.215, 20, 16), skinMat);
  skull.castShadow = true;
  head.add(skull);

  const eyeGeo = new THREE.SphereGeometry(0.022, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 });
  [-0.072, 0.072].forEach((x) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.015, 0.198);
    head.add(eye);
  });

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.223, 18, 14), hairMat);
  hairCap.scale.set(1.03, 0.74, 1.04);
  hairCap.position.set(0, 0.075, -0.012);
  head.add(hairCap);

  if (style === 'long') {
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.3, 4, 12), hairMat);
    back.position.set(0, -0.19, -0.12);
    head.add(back);
  } else if (style === 'bun') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), hairMat);
    bun.position.set(0, 0.22, -0.1);
    head.add(bun);
  } else if (style === 'side') {
    const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), hairMat);
    fringe.scale.set(1.4, 0.55, 0.9);
    fringe.position.set(0.06, 0.16, 0.1);
    head.add(fringe);
  }

  if (tie) {
    box(g, 0.075, 0.3, 0.025, M.red, 0, 0.85, 0.222, { cast: false });
    box(g, 0.16, 0.06, 0.02, M.white, 0, 1.02, 0.222, { cast: false });
  }

  const armGeo = new THREE.CapsuleGeometry(0.068, 0.28, 4, 10);
  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.265, 1.03, 0.02);
    g.add(pivot);
    const arm = new THREE.Mesh(armGeo, shirtMat);
    arm.position.y = -0.2;
    arm.castShadow = true;
    pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), skinMat);
    hand.position.y = -0.38;
    pivot.add(hand);
    pivot.rotation.x = -0.85;
    return pivot;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  const legGeo = new THREE.CapsuleGeometry(0.072, 0.32, 4, 10);
  const makeLeg = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.105, 0.53, 0.02);
    pivot.visible = false;
    g.add(pivot);
    const leg = new THREE.Mesh(legGeo, M.pants);
    leg.position.y = -0.235;
    leg.castShadow = true;
    pivot.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.24), M.shoe);
    shoe.position.set(0, -0.44, 0.05);
    shoe.castShadow = true;
    pivot.add(shoe);
    return pivot;
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  return { group: g, head, armL, armR, legL, legR, phase: Math.random() * Math.PI * 2 };
}

// ---------------------------------------------------------------- rooms

function addStaffTag(parent, member, color, x, z) {
  const tag = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: staffTagTexture(member.name, member.role, color),
      transparent: true,
      depthWrite: false,
    })
  );
  tag.scale.set(2.15, 0.59, 1);
  tag.position.set(x, 2.0, z);
  tag.renderOrder = 19;
  parent.add(tag);
  return tag;
}

function addStaffPick(world, person, member, d) {
  const pick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 2.0, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  pick.position.y = 1.0;
  pick.userData.staffId = member.id;
  pick.userData.deptId = d.id;
  person.group.add(pick);
  world.staffPickables.push(pick);
  return pick;
}

function addExtraWorkstation(world, d, room, member, slot) {
  const g = room.group;
  const station = new THREE.Group();
  station.userData.slot = slot;
  station.userData.memberId = member.id;
  g.add(station);

  const base = d.extraSide || 1;
  const side = slot % 2 === 0 ? base : -base;
  const front = slot % 2 === 1;
  const x = d.posX + side * 4.55;
  const deskZ = d.posZ + (front ? 1.55 : -1.5);
  const seatZ = d.posZ + (front ? 0.55 : -2.5);

  const desk = addDesk(station, x, deskZ, 2.4, 1.35);
  box(desk, 0.7, 0.03, 0.22, M.keyboard, 0, 0.795, 0.33, { cast: false });
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.keyboard);
  mouse.scale.set(0.8, 0.5, 1.2);
  mouse.position.set(0.52, 0.805, 0.33);
  desk.add(mouse);
  station.userData.screenMat = addMonitor(desk, 0, -0.28, {
    kind: member.screen || DEPT_SCREENS[d.id] || 'dash',
    color: d.color,
  });
  room.screens.push(station.userData.screenMat);
  addPaperStack(desk, side > 0 ? -0.58 : 0.62, 0.26, 2, 0.1);
  addChair(station, x, seatZ, 0, false);

  const look = member.look || HIRE_LOOKS[slot % HIRE_LOOKS.length];
  const person = createPerson({
    shirt: d.colorHex,
    skin: look.skin,
    hair: look.hair,
    style: look.style,
    tie: Boolean(look.tie),
  });
  person.group.position.set(x, FLOOR_Y + SEAT_DROP, seatZ);
  station.add(person.group);

  const pick = addStaffPick(world, person, member, d);
  const tag = addStaffTag(station, member, d.color, x, seatZ);
  station.userData.tag = tag;

  world.people[member.id] = {
    ...person,
    active: false,
    baseY: FLOOR_Y,
    home: new THREE.Vector3(x, FLOOR_Y, seatZ),
    walk: null,
    standing: false,
    lookYaw: null,
    yOff: SEAT_DROP,
    pick,
  };

  room.tags.push(tag);
  room.stations[member.id] = station;
}

function buildRoom(scene, world, d, extras = [], dismissed = []) {
  const g = new THREE.Group();
  scene.add(g);

  const { posX, posZ } = d;
  const baseRaw = d.staffList?.length ? d.staffList : [{ id: d.id, name: d.staff, role: d.role }];
  const gone = new Set(dismissed);
  const baseMembers = baseRaw.filter((m, i) => i === 0 || !gone.has(m.id));
  const room = {
    group: g,
    ring: null,
    sprite: null,
    screens: [],
    active: false,
    dept: d,
    members: [],
    extraMembers: [],
    tags: [],
    stations: {},
    mainTag: null,
    notif: null,
  };
  world.rooms[d.id] = room;
  const isTop = posZ < 0;
  const backZ = posZ - WORLD.roomD / 2;
  const frontZ = posZ + WORLD.roomD / 2;
  const color = new THREE.Color(d.colorHex);
  const deptMat = new THREE.MeshStandardMaterial({ color: color.clone(), roughness: 0.75 });
  const trimMat = new THREE.MeshStandardMaterial({ color: color.clone().lerp(WHITE, 0.08), roughness: 0.7 });

  // floor + rug
  box(g, WORLD.roomW, 0.12, WORLD.roomD, tintMat(d.colorHex, 0.9), posX, 0.06, posZ, { cast: false });
  const rug = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRectShape(10.6, 8.4, 0.5), { depth: 0.04, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: color.clone().lerp(WHITE, 0.72), roughness: 1 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(posX, 0.125, posZ);
  rug.receiveShadow = true;
  g.add(rug);

  // back wall
  const gap = 2.2;
  if (isTop) {
    box(g, WORLD.roomW, WORLD.backH, 0.2, M.wall, posX, WORLD.backH / 2, backZ);
  } else {
    // vách kính phía hành lang để vẫn nhìn thấy lối đi và người di chuyển
    const segW = (WORLD.roomW - gap) / 2;
    box(g, segW, WORLD.backH, 0.06, M.glass, posX - (gap / 2 + segW / 2), WORLD.backH / 2, backZ, { cast: false });
    box(g, segW, WORLD.backH, 0.06, M.glass, posX + (gap / 2 + segW / 2), WORLD.backH / 2, backZ, { cast: false });
    box(g, gap, WORLD.backH - 2.2, 0.06, M.glass, posX, 2.2 + (WORLD.backH - 2.2) / 2, backZ, { cast: false });
    box(g, WORLD.roomW, 0.1, 0.16, M.metal, posX, WORLD.backH + 0.05, backZ, { cast: false });
    [-4.5, -2.8, 2.8, 4.5].forEach((ox) => {
      box(g, 0.06, WORLD.backH, 0.1, M.metal, posX + ox, WORLD.backH / 2, backZ, { cast: false });
    });
    box(g, 0.12, 2.2, 0.26, deptMat, posX - gap / 2, 1.1, backZ);
    box(g, 0.12, 2.2, 0.26, deptMat, posX + gap / 2, 1.1, backZ);
    box(g, gap, 0.03, 0.9, deptMat, posX, 0.135, backZ + 0.62, { cast: false });
  }

  // side walls — vách chung chỉ dựng một lần bởi phòng bên trái
  const hasLeftNeighbor = DEPARTMENTS.some(
    (o) => o.id !== d.id && Math.abs(o.posZ - posZ) < 0.01 && Math.abs(o.posX + WORLD.roomW - posX) < 0.01
  );
  const sides = hasLeftNeighbor ? [1] : [-1, 1];
  sides.forEach((side) => {
    const sx = posX + side * (WORLD.roomW / 2);
    box(g, 0.18, WORLD.wallH, WORLD.roomD, M.wall, sx, WORLD.wallH / 2, posZ);
    box(g, 0.22, 0.1, WORLD.roomD, trimMat, sx, WORLD.wallH + 0.05, posZ);
  });

  // front low wall (top row only, opens to the atrium)
  if (isTop) {
    const segW = (WORLD.roomW - gap) / 2;
    box(g, segW, WORLD.wallH, 0.18, M.wall, posX - (gap / 2 + segW / 2), WORLD.wallH / 2, frontZ);
    box(g, segW, WORLD.wallH, 0.18, M.wall, posX + (gap / 2 + segW / 2), WORLD.wallH / 2, frontZ);
    box(g, segW, 0.1, 0.22, trimMat, posX - (gap / 2 + segW / 2), WORLD.wallH + 0.05, frontZ);
    box(g, segW, 0.1, 0.22, trimMat, posX + (gap / 2 + segW / 2), WORLD.wallH + 0.05, frontZ);
    box(g, 0.12, WORLD.wallH, 0.24, deptMat, posX - gap / 2, WORLD.wallH / 2, frontZ);
    box(g, 0.12, WORLD.wallH, 0.24, deptMat, posX + gap / 2, WORLD.wallH / 2, frontZ);
  }

  // wall poster
  const posterX = posX === 0 ? 0 : posX + (posX < 0 ? 3.2 : -3.2);
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.1),
    new THREE.MeshStandardMaterial({ map: posterTexture(d), roughness: 0.85 })
  );
  poster.position.set(posterX, 2.08, backZ + 0.12);
  g.add(poster);

  // accent point light
  const pLight = new THREE.PointLight(d.colorHex, 2.6, 9, 2);
  pLight.position.set(posX, 2.7, posZ);
  g.add(pLight);

  // desk / chair / person
  const deskW = d.id === 'director' ? 4.2 : d.id === 'tech' ? 3.6 : 3.2;
  const deskD = d.id === 'director' ? 1.8 : 1.5;
  const desk = addDesk(g, posX, posZ - 1.5, deskW, deskD);

  const personX = posX;
  const personZ = posZ - 2.5;
  addChair(g, personX, personZ, 0, d.id === 'director');
  const person = createPerson({
    shirt: d.colorHex,
    skin: ['#f2c9a0', '#e6b489', '#d9a06b', '#f0c39b', '#e8b892'][DEPARTMENTS.indexOf(d)],
    hair: ['#3b2a21', '#1f2937', '#4a3728', '#6b7280', '#2f2a26'][DEPARTMENTS.indexOf(d)],
    style: ['long', 'short', 'long', 'short', 'bun'][DEPARTMENTS.indexOf(d)],
    tie: d.id === 'director',
  });
  person.group.position.set(personX, FLOOR_Y + SEAT_DROP, personZ);
  g.add(person.group);
  const mainPick = addStaffPick(world, person, baseMembers[0], d);

  // keyboard + mouse
  box(desk, 0.86, 0.03, 0.24, M.keyboard, 0, 0.795, 0.36, { cast: false });
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), M.keyboard);
  mouse.scale.set(0.8, 0.5, 1.2);
  mouse.position.set(0.58, 0.805, 0.36);
  desk.add(mouse);

  const screens = room.screens;
  const colorCss = d.color;

  // per-department props
  if (d.id === 'hr') {
    screens.push(addMonitor(desk, -0.62, -0.32, { kind: 'ai', color: colorCss, rotY: 0.08 }));
    addLaptop(desk, 0.78, -0.2, 'ai', colorCss, -0.18);
    addPaperStack(desk, 0.55, 0.32, 2, 0.2);
    addShelf(g, posX - 4.35, backZ + 0.5);
    addArmchair(g, posX + 3.9, posZ + 1.3, -0.7, 0x7f8fa6);
    addPlant(g, posX + 4.7, posZ + 3.5, 1);
    addPlant(g, posX - 4.6, posZ + 3.4, 0.8);

    const holo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: aiHoloTexture(), transparent: true, opacity: 0.9, depthWrite: false,
      })
    );
    holo.scale.set(2.2, 0.69, 1);
    holo.position.set(posX + 3.5, 2.95, posZ - 1.9);
    holo.userData.baseY = 2.95;
    holo.renderOrder = 21;
    g.add(holo);
    world.aiHolo = holo;
  } else if (d.id === 'tech') {
    screens.push(addMonitor(desk, -0.75, -0.34, { kind: 'cad', color: colorCss, rotY: 0.14 }));
    screens.push(addMonitor(desk, 0.45, -0.34, { kind: 'cad', color: colorCss, rotY: -0.14 }));
    const bp = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.86),
      new THREE.MeshStandardMaterial({ map: blueprintTexture(), roughness: 0.8 })
    );
    bp.rotation.x = -Math.PI / 2;
    bp.rotation.z = 0.12;
    bp.position.set(1.05, 0.786, 0.22);
    desk.add(bp);
    addShelf(g, posX + 4.35, backZ + 0.5);
    addTubeBundle(g, posX - 4.1, posZ + 2.6);
    addPlant(g, posX - 4.7, posZ + 3.6, 1.05);
  } else if (d.id === 'sales') {
    screens.push(addMonitor(desk, 0.62, -0.34, { kind: 'chart', color: colorCss, rotY: -0.1 }));
    addLaptop(desk, -0.7, -0.18, 'ledger', colorCss, 0.2);
    box(desk, 0.2, 0.045, 0.13, M.dark, -0.05, 0.8, 0.3, { cast: false });
    addWhiteboard(g, posX + 3.7, posZ + 0.4, -0.8, colorCss);
    addShelf(g, posX - 4.35, backZ + 0.5);
    addGuestChair(g, posX - 1.9, posZ - 0.2, Math.PI + 0.15);
    addPlant(g, posX + 4.75, posZ + 3.4, 0.9);
  } else if (d.id === 'director') {
    screens.push(addMonitor(desk, -1.05, -0.4, { kind: 'dash', color: colorCss, w: 1.1, h: 0.62, rotY: 0.24 }));
    addLaptop(desk, 0.95, -0.28, 'ledger', colorCss, -0.22);
    box(desk, 0.62, 0.05, 0.2, M.gold, 0.12, 0.8, 0.42, { cast: false });
    addShelf(g, posX + 4.35, backZ + 0.5);
    addGuestChair(g, posX - 1.35, posZ - 0.15, Math.PI);
    addGuestChair(g, posX + 1.35, posZ - 0.15, Math.PI);
    addPlant(g, posX - 4.75, posZ + 3.4, 1.1);
    addPlant(g, posX + 4.75, posZ + 3.4, 0.85);
    // low cabinet with awards
    box(g, 2.4, 0.62, 0.55, M.cabinet, posX + 3.55, 0.41, posZ + 3.3);
    [0, 1, 2].forEach((i) => {
      cyl(g, 0.012, 0.012, 0.3, 6, M.gold, posX + 2.9 + i * 0.55, 0.9, posZ + 3.3);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), M.gold);
      star.position.set(posX + 2.9 + i * 0.55, 1.1, posZ + 3.3);
      star.castShadow = true;
      g.add(star);
    });
  } else if (d.id === 'accounting') {
    screens.push(addMonitor(desk, -0.66, -0.33, { kind: 'ledger', color: colorCss, rotY: 0.1 }));
    screens.push(addMonitor(desk, 0.66, -0.33, { kind: 'ledger', color: colorCss, rotY: -0.1 }));
    addPaperStack(desk, -1.18, 0.3, 4, 0.1);
    const calc = box(desk, 0.24, 0.03, 0.32, M.dark, 1.19, 0.79, 0.32, { cast: false });
    box(calc, 0.16, 0.005, 0.08, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }), 0, 0.018, -0.08);
    addFilingCabinet(g, posX + 4.6, posZ - 2.4, -Math.PI / 2);
    addFilingCabinet(g, posX + 4.6, posZ - 1.3, -Math.PI / 2);
    addShelf(g, posX - 4.35, backZ + 0.5);
    addPlant(g, posX - 4.7, posZ + 3.4, 0.95);
  }

  // extra workstations for roster members (up to 3 staff per room)
  const baseIds = new Set(baseMembers.map((m) => m.id));
  const extraMembers = extras.filter((m) => m && !baseIds.has(m.id));
  const members = [...baseMembers, ...extraMembers].slice(0, MAX_STAFF);
  room.members = members;
  room.extraMembers = members.slice(1);
  if (members.length > 1) {
    room.extraMembers.forEach((m, slot) => addExtraWorkstation(world, d, room, m, slot));
    room.mainTag = addStaffTag(g, members[0], d.color, posX, posZ - 2.5);
  }

  // room label
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: labelTexture(d), transparent: true, depthWrite: false })
  );
  sprite.scale.set(4.9, 1.225, 1);
  sprite.position.set(posX, 4.3, posZ);
  sprite.renderOrder = 20;
  g.add(sprite);

  // badge thông báo nổi phía trên phòng
  const notif = new THREE.Sprite(
    new THREE.SpriteMaterial({ transparent: true, depthWrite: false })
  );
  notif.scale.set(2.6, 1.17, 1);
  notif.position.set(posX, 5.55, posZ);
  notif.renderOrder = 22;
  notif.visible = false;
  g.add(notif);
  room.notif = notif;
  room.notifBaseY = 5.55;

  // selection / highlight ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(4.25, 4.5, 72),
    new THREE.MeshBasicMaterial({
      color: d.colorHex,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(posX, 0.175, posZ);
  ring.renderOrder = 5;
  g.add(ring);

  // invisible pick volume
  const pick = new THREE.Mesh(
    new THREE.BoxGeometry(WORLD.roomW, 3.8, WORLD.roomD),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  pick.position.set(posX, 1.9, posZ);
  pick.userData.deptId = d.id;
  g.add(pick);
  world.pickables.push(pick);

  room.ring = ring;
  room.sprite = sprite;

  world.people[baseMembers[0].id] = {
    ...person,
    active: false,
    baseY: FLOOR_Y,
    home: new THREE.Vector3(personX, FLOOR_Y, personZ),
    walk: null,
    standing: false,
    lookYaw: null,
    yOff: SEAT_DROP,
    pick: mainPick,
  };
}

// ---------------------------------------------------------------- entrance

function addEntrance(scene, world) {
  const pad = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.42, 56),
    new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(ENTRY.x, 0.02, ENTRY.z);
  scene.add(pad);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.12, 48),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.05 })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(ENTRY.x, 0.015, ENTRY.z);
  scene.add(disc);

  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: clientTexture(), transparent: true, depthWrite: false })
  );
  label.scale.set(2.9, 0.9, 1);
  label.position.set(ENTRY.x, 2.75, ENTRY.z);
  label.renderOrder = 20;
  scene.add(label);

  const sign = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: signTexture(), transparent: true, depthWrite: false })
  );
  sign.scale.set(7.4, 1.85, 1);
  sign.position.set(ENTRY.x, 4.5, ENTRY.z - 1.2);
  sign.renderOrder = 20;
  scene.add(sign);

  // planters framing the entrance
  addPlant(scene, ENTRY.x - 2.6, ENTRY.z + 0.4, 1.15);
  addPlant(scene, ENTRY.x + 2.6, ENTRY.z + 0.4, 1.15);
}

// ---------------------------------------------------------------- guides

function addGuideLines(scene) {
  const hub = new THREE.Vector3(0, 0.055, WORLD.corridorZ);
  const lineMat = 0x9db0c6;

  const entryLine = dashedFloorLine(
    [
      new THREE.Vector3(ENTRY.x, 0.055, ENTRY.z),
      new THREE.Vector3(ENTRY.x, 0.055, WORLD.corridorZ),
      hub,
    ],
    lineMat,
    0.5
  );
  scene.add(entryLine);

  for (const d of DEPARTMENTS) {
    const isTop = d.posZ < 0;
    const doorZ = isTop ? d.posZ + WORLD.roomD / 2 + 0.5 : d.posZ - WORLD.roomD / 2 - 0.5;
    const pts = [
      hub.clone(),
      new THREE.Vector3(d.posX, 0.055, WORLD.corridorZ),
      new THREE.Vector3(d.posX, 0.055, doorZ),
    ];
    scene.add(dashedFloorLine(pts, lineMat, 0.38));
  }
}

// ---------------------------------------------------------------- token

function addToken(scene, world) {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.55 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.025), frameMat);
  frame.position.z = -0.012;
  group.add(frame);

  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.035), paperMat);
  paper.position.z = 0.012;
  paper.castShadow = true;
  group.add(paper);

  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x14b8a6, emissive: 0x14b8a6, emissiveIntensity: 0.7,
  });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.04), stripeMat);
  stripe.position.y = -0.18;
  group.add(stripe);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  [0.1, 0.04, -0.03].forEach((y, i) => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(i === 2 ? 0.14 : 0.22, 0.018, 0.005), lineMat);
    line.position.set(-0.03, y, 0.0205);
    group.add(line);
  });

  const ringMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.85 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.016, 8, 56), ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture(), color: 0x14b8a6, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(2.5);
  group.add(glow);

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x14b8a6,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.5, 1.9, 20, 1, true), beamMat);
  beam.position.y = -1.0;
  group.add(beam);

  const light = new THREE.PointLight(0x14b8a6, 1.6, 6, 2);
  group.add(light);

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.05, 48),
    new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(ENTRY.x, 0.2, ENTRY.z);
  scene.add(marker);

  group.scale.setScalar(1.35);
  group.position.set(ENTRY.x, 1.55, ENTRY.z);
  scene.add(group);

  world.token = {
    group, paper, stripe, ring, glow, light, marker, beam,
    stripeMat, ringMat, glowMat, frameMat, beamMat,
  };
}

// ---------------------------------------------------------------- walking

function dampAngle(cur, target, k) {
  let diff = (target - cur + Math.PI) % (Math.PI * 2);
  if (diff < 0) diff += Math.PI * 2;
  diff -= Math.PI;
  return cur + diff * Math.min(1, k);
}

function updateWalk(p, dt) {
  const w = p.walk;
  w.dist = Math.min(w.total, w.dist + w.speed * dt);

  let seg = w.segs[w.segs.length - 1];
  for (const s of w.segs) {
    if (w.dist <= s.start + s.len + 1e-4) { seg = s; break; }
  }
  const k = seg.len > 1e-5 ? Math.min(1, (w.dist - seg.start) / seg.len) : 1;
  const x = seg.a.x + (seg.b.x - seg.a.x) * k;
  const z = seg.a.z + (seg.b.z - seg.a.z) * k;
  const yaw = Math.atan2(seg.b.x - seg.a.x, seg.b.z - seg.a.z);
  p.group.rotation.y = dampAngle(p.group.rotation.y, yaw, dt * 10);
  p.yOff += (0 - p.yOff) * Math.min(1, dt * 10);

  w.phase += dt * w.speed * 2.1;
  const sw = Math.sin(w.phase);
  p.group.position.set(x, FLOOR_Y + p.yOff + Math.abs(sw) * 0.035, z);
  p.legL.rotation.x = sw * 0.55;
  p.legR.rotation.x = -sw * 0.55;
  p.armL.rotation.x = -0.35 - sw * 0.5;
  p.armR.rotation.x = -0.35 + sw * 0.5;
  p.head.rotation.y = Math.sin(w.phase * 0.5) * 0.08;
  p.head.rotation.z = 0;

  if (w.dist >= w.total) {
    p.walk = null;
    p.group.position.set(seg.b.x, FLOOR_Y, seg.b.z);
    p.legL.rotation.x = 0;
    p.legR.rotation.x = 0;
    p.standing = w.end !== 'sit';
    if (!p.standing) {
      p.group.rotation.y = 0;
      p.head.rotation.set(0, 0, 0);
      p.armL.rotation.x = -0.85;
      p.armR.rotation.x = -0.85;
    }
    p.legL.visible = p.legR.visible = p.standing;
    w.resolve(true);
  }
}

// ---------------------------------------------------------------- build

export function buildWorld(scene, extras = {}, dismissed = {}) {
  initMaterials();
  const world = {
    rooms: {},
    people: {},
    pickables: [],
    staffPickables: [],
    plants: [],
    token: null,
    aiHolo: null,
  };

  addGround(scene);
  addLights(scene);
  plantSink = world.plants;
  addEntrance(scene, world);
  for (const d of DEPARTMENTS) buildRoom(scene, world, d, extras[d.id] || [], dismissed[d.id] || []);
  plantSink = null;
  addGuideLines(scene);
  addToken(scene, world);

  world.addStaffMember = (d, member) => {
    const room = world.rooms[d.id];
    if (!room) return false;
    const used = new Set(Object.values(room.stations).map((s) => s.userData.slot));
    let slot = -1;
    for (let i = 0; i < MAX_STAFF - 1; i++) {
      if (!used.has(i)) { slot = i; break; }
    }
    if (slot < 0) return false;
    if (!room.mainTag) {
      room.mainTag = addStaffTag(room.group, room.members[0], d.color, d.posX, d.posZ - 2.5);
    }
    addExtraWorkstation(world, d, room, member, slot);
    room.extraMembers.push(member);
    room.members.push(member);
    return true;
  };

  world.removeStaffMember = (deptId, staffId) => {
    const room = world.rooms[deptId];
    if (!room) return false;
    const station = room.stations[staffId];
    const p = world.people[staffId];
    if (!station || !p) return false;

    if (p.walk) {
      const done = p.walk.resolve;
      p.walk = null;
      done(false);
    }
    const pi = world.staffPickables.indexOf(p.pick);
    if (pi >= 0) world.staffPickables.splice(pi, 1);
    const tag = station.userData.tag;
    if (tag) {
      const ti = room.tags.indexOf(tag);
      if (ti >= 0) room.tags.splice(ti, 1);
      tag.material.map?.dispose();
      tag.material.dispose();
    }
    const si = room.screens.indexOf(station.userData.screenMat);
    if (si >= 0) room.screens.splice(si, 1);
    room.group.remove(station);
    delete world.people[staffId];
    delete room.stations[staffId];
    room.members = room.members.filter((m) => m.id !== staffId);
    room.extraMembers = room.extraMembers.filter((m) => m.id !== staffId);
    if (!room.extraMembers.length && room.mainTag) {
      room.group.remove(room.mainTag);
      room.mainTag.material.map?.dispose();
      room.mainTag.material.dispose();
      room.mainTag = null;
    }
    return true;
  };

  world.walkPerson = (id, points, opts = {}) => {
    const p = world.people[id];
    if (!p) return Promise.resolve(false);
    return new Promise((resolve) => {
      if (p.walk) p.walk.resolve(false);
      const pts = [];
      for (const v of points) {
        const prev = pts[pts.length - 1];
        if (!prev || prev.distanceToSquared(v) > 0.0009) pts.push(v.clone());
      }
      if (pts.length < 2) { resolve(false); return; }
      const segs = [];
      let total = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const len = a.distanceTo(b);
        segs.push({ a, b, len, start: total });
        total += len;
      }
      p.walk = {
        segs, total, dist: 0,
        speed: Math.max(0.5, opts.speed || 5),
        phase: 0,
        end: opts.end || 'stand',
        resolve,
      };
      p.standing = true;
      p.lookYaw = null;
      p.legL.visible = p.legR.visible = true;
    });
  };

  world.facePerson = (id, yaw) => {
    const p = world.people[id];
    if (p && !p.walk) p.lookYaw = yaw;
  };

  world.parkPerson = (id) => {
    const p = world.people[id];
    if (!p) return;
    if (p.walk) {
      const done = p.walk.resolve;
      p.walk = null;
      done(false);
    }
    p.standing = false;
    p.lookYaw = null;
    p.active = false;
    p.yOff = SEAT_DROP;
    p.group.position.set(p.home.x, FLOOR_Y + SEAT_DROP, p.home.z);
    p.group.rotation.y = 0;
    p.legL.visible = p.legR.visible = false;
    p.legL.rotation.x = p.legR.rotation.x = 0;
    p.armL.rotation.x = -0.85;
    p.armR.rotation.x = -0.85;
    p.head.rotation.set(0, 0, 0);
  };

  world.resetPeople = () => {
    for (const id of Object.keys(world.people)) world.parkPerson(id);
  };

  world.hasWalkers = () => Object.values(world.people).some((p) => p.walk);

  world.setRoomNotif = (deptId, count) => {
    const room = world.rooms[deptId];
    if (!room || !room.notif) return;
    const n = Math.max(0, Math.min(9, Number(count) || 0));
    if (n === 0) {
      room.notif.visible = false;
      return;
    }
    room.notif.material.map = getNotifTexture(n);
    room.notif.material.needsUpdate = true;
    if (!room.notif.visible) {
      room.notif.visible = true;
      room.notif.scale.set(0.5, 0.225, 1);
    }
  };

  world.update = (t, dt) => {
    for (const p of Object.values(world.people)) {
      if (!p) continue;
      if (p.walk) {
        updateWalk(p, dt);
        continue;
      }
      p.legL.visible = p.legR.visible = p.standing;
      const yTarget = p.standing ? 0 : SEAT_DROP;
      p.yOff += (yTarget - p.yOff) * Math.min(1, dt * 8);
      p.group.position.y = p.baseY + p.yOff + Math.sin(t * 1.6 + p.phase) * 0.008;
      if (p.lookYaw != null) {
        p.group.rotation.y = dampAngle(p.group.rotation.y, p.lookYaw, dt * 6);
      }
      p.head.rotation.y = Math.sin(t * 0.55 + p.phase) * 0.24;
      p.head.rotation.z = Math.sin(t * 0.4 + p.phase) * 0.03;
      if (p.standing) {
        p.armL.rotation.x = -0.16 + Math.sin(t * 1.2 + p.phase) * 0.05;
        p.armR.rotation.x = -0.16 + Math.sin(t * 1.2 + p.phase + 1.9) * 0.05;
        p.legL.rotation.x = p.legR.rotation.x = 0;
      } else {
        const typing = p.active ? 1 : 0;
        const amp = typing ? 0.13 : 0.02;
        const spd = typing ? 11 : 1.1;
        p.armL.rotation.x = -0.85 + Math.sin(t * spd + p.phase) * amp;
        p.armR.rotation.x = -0.85 + Math.sin(t * spd + p.phase + 1.7) * amp;
      }
    }
    for (const pl of world.plants) {
      pl.group.rotation.z = Math.sin(t * 0.9 + pl.phase) * 0.018;
    }
    if (world.aiHolo) {
      world.aiHolo.position.y = world.aiHolo.userData.baseY + Math.sin(t * 1.35) * 0.05;
      world.aiHolo.material.opacity = 0.82 + 0.12 * Math.sin(t * 2.2);
    }
    for (const r of Object.values(world.rooms)) {
      if (!r.notif || !r.notif.visible) continue;
      r.notif.position.y = r.notifBaseY + Math.sin(t * 2.2) * 0.08;
      const s = r.notif.scale.x + (2.6 - r.notif.scale.x) * Math.min(1, dt * 6);
      r.notif.scale.set(s, s * 0.45, 1);
    }
  };

  return world;
}
