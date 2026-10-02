const PRODUCTS = [
  {slug:"kasir-toko",      name:"Aplikasi Kasir Toko",        desc:"Kasir lengkap untuk toko & retail: transaksi cepat, stok, dan laporan harian."},
  {slug:"kasir-cafe-resto",name:"Aplikasi Kasir Cafe & Resto",desc:"Kelola pesanan meja, menu, dan transaksi cafe/resto dengan mudah."},
  {slug:"kasir-laundry",   name:"Aplikasi Kasir Laundry",     desc:"Nota laundry, status cucian, dan rekap pelanggan dalam satu aplikasi."},
  {slug:"nota-bengkel",    name:"Aplikasi Nota Bengkel",      desc:"Buat nota servis & sparepart untuk bengkel motor/mobil."},
  {slug:"karcis-parkir",   name:"Aplikasi Karcis Parkir",     desc:"Cetak karcis dan rekap pendapatan parkir harian."},
  {slug:"stok-gudang",     name:"Aplikasi Stok Gudang",       desc:"Catat stok masuk-keluar dan pantau sisa barang gudang."},
  {slug:"laba-rugi",       name:"Aplikasi Laporan Laba Rugi", desc:"Hitung untung-rugi usaha otomatis per periode."},
  {slug:"keuangan-pribadi",name:"Aplikasi Keuangan Pribadi",  desc:"Catat pemasukan-pengeluaran dan atur budget bulanan."},
  {slug:"kalkulator-hpp",  name:"Kalkulator HPP",             desc:"Hitung harga pokok produksi biar nggak salah pasang harga jual."},
  {slug:"buku-kasbon",     name:"Aplikasi Buku Kasbon",       desc:"Catat kasbon karyawan & pelanggan dengan rapi dan terstruktur."},
  {slug:"kelola-arisan",   name:"Aplikasi Kelola Arisan",     desc:"Atur jadwal kocokan, iuran, dan data anggota arisan."},
  {slug:"data-pelanggan",  name:"Aplikasi Data Pelanggan",    desc:"Database pelanggan lengkap dengan riwayat transaksi."},
  {slug:"absensi-karyawan",name:"Aplikasi Absensi Karyawan",  desc:"Absensi harian karyawan plus rekap kehadiran otomatis."},
  {slug:"invoice-kwitansi",name:"Aplikasi Invoice & Kwitansi",desc:"Buat invoice profesional dan kwitansi pembayaran."},
  {slug:"surat-resmi",     name:"Aplikasi Surat Resmi",       desc:"Template surat lamaran, izin, keterangan, dan lainnya."},
  {slug:"katalog-produk",  name:"Aplikasi Katalog Digital",   desc:"Katalog produk digital siap share ke pelanggan via link."},
  {slug:"nomor-antrian",   name:"Aplikasi Nomor Antrian",     desc:"Sistem antrian digital untuk loket, klinik, dan layanan."},
  {slug:"todo-pengingat",  name:"Aplikasi To-Do & Pengingat", desc:"Daftar tugas harian plus pengingat biar nggak ada yang lupa."},
  {slug:"simulasi-cicilan",name:"Aplikasi Simulasi Cicilan",  desc:"Hitung cicilan & bunga pinjaman sebelum ambil kredit."},
  {slug:"kalkulator-zakat",name:"Kalkulator Zakat",           desc:"Hitung zakat penghasilan, emas, dan perdagangan dengan akurat."},
];
const PRICE = "Rp129.000";
const TOKOPEDIA = "https://www.tokopedia.com/wartech89";
const SHOPEE = "https://shopee.co.id/rahmadalhabib";

const grid = document.getElementById("product-grid");
for (const p of PRODUCTS) {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML =
    '<img loading="lazy" src="assets/' + p.slug + '.jpg" alt="' + p.name + '">' +
    '<div class="card-body"><h3>' + p.name + '</h3><p>' + p.desc + '</p>' +
    '<div class="price">' + PRICE + '</div>' +
    '<div class="buy-row">' +
    '<a class="buy-tok" href="' + TOKOPEDIA + '" target="_blank" rel="noopener">Tokopedia</a>' +
    '<a class="buy-shp" href="' + SHOPEE + '" target="_blank" rel="noopener">Shopee</a>' +
    '</div></div>';
  grid.appendChild(el);
}

// ---- AI Chat ----
const log = document.getElementById("chat-log");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const history = [];

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + role;
  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = text;
  div.appendChild(b);
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg("user", text);
  history.push({ role: "user", content: text });
  const typing = addMsg("ai", "mengetik…");
  typing.firstChild.classList.add("typing");
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-10) }),
    });
    const data = await res.json();
    typing.remove();
    if (!res.ok || !data.reply) throw new Error(data.error || "gagal");
    addMsg("ai", data.reply);
    history.push({ role: "assistant", content: data.reply });
  } catch (err) {
    typing.remove();
    addMsg("ai", "Maaf, AI-nya lagi istirahat sebentar. Coba lagi ya 🙏");
  }
});
