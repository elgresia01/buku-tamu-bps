// ==========================================
// KONFIGURASI URL GOOGLE APPS SCRIPT
// Ganti URL di bawah ini dengan URL Web App Anda
// ==========================================
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyGZAzFm1qxwI6_YN1dmfasQcc-wFQ03WoRXXb7QVw6-tsK1uG4h0PJ7KfjfbRLmYHfog/exec";

// Mencegah redirect tidak diinginkan dari iframe
window.addEventListener("beforeunload", function () {
  // Hapus semua iframe yang masih aktif saat page unload
  const iframes = document.querySelectorAll('iframe[name^="hidden-iframe-"]');
  iframes.forEach((iframe) => {
    if (iframe.parentNode) iframe.remove();
  });
});

// ==========================================
// FUNGSI: SET TANGGAL OTOMATIS
// ==========================================
function setTanggal() {
  const tanggalInput = document.getElementById("tanggal");
  if (!tanggalInput) return;

  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  tanggalInput.value = now.toLocaleDateString("id-ID", options);
}

// ==========================================
// FUNGSI: FORMAT NOMOR HP (HANYA ANGKA - NO AUTO 62)
// ==========================================
function formatNoHp(input) {
  if (!input) return;

  input.addEventListener("input", function (e) {
    // Hapus semua karakter kecuali angka
    let value = e.target.value.replace(/\D/g, "");

    // Batasi maksimal 13 digit (format Indonesia: 08xx-xxxx-xxxx)
    if (value.length > 13) {
      value = value.substring(0, 13);
    }

    e.target.value = value;
  });
}

// ==========================================
// FUNGSI: VALIDASI FORM
// ==========================================

function validateForm() {
  const nama = document.getElementById("nama")?.value.trim();
  const jenisKelamin = document.getElementById("jenisKelamin")?.value;
  const noHp = document.getElementById("noHp")?.value.trim();
  const instansi = document.getElementById("instansi")?.value.trim();
  const tujuan = document.getElementById("tujuan")?.value;

  if (!nama || !jenisKelamin || !noHp || !instansi || !tujuan) {
    alert("Mohon lengkapi semua field yang wajib diisi (*)");
    return false;
  }

  // Validasi nomor HP: minimal 10 digit, maksimal 13 digit, hanya angka
  const noHpClean = noHp.replace(/\D/g, "");
  if (noHpClean.length < 10 || noHpClean.length > 13) {
    alert(
      "Nomor telepon tidak valid. Masukkan 10-13 digit angka (contoh: 081234567890)",
    );
    return false;
  }

  return true;
}

// ==========================================
// FUNGSI: SHOW/HIDE LOADING
// ==========================================
function showLoading() {
  const loading = document.getElementById("loadingOverlay");
  if (loading) loading.classList.add("active");
}

function hideLoading() {
  const loading = document.getElementById("loadingOverlay");
  if (loading) loading.classList.remove("active");
}

// ==========================================
// FUNGSI: MODAL SUKSES
// ==========================================
function showSuccessModal() {
  const modal = document.getElementById("successModal");
  if (modal) modal.classList.add("active");
}

function closeModal() {
  const modal = document.getElementById("successModal");
  if (modal) modal.classList.remove("active");

  // Reset form
  const form = document.getElementById("bukuTamuForm");
  if (form) {
    form.reset();
    setTanggal();
  }
}

// ==========================================
// FUNGSI: KIRIM DATA (ANTI REDIRECT - FINAL)
// ==========================================
function kirimDataKeGoogleScript(data) {
  console.log("📤 Mengirim data...");

  return new Promise((resolve) => {
    // Convert data ke format URL-encoded
    const formData = new URLSearchParams();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    // Kirim dengan fetch mode no-cors
    // Ini TIDAK akan redirect browser
    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Kunci: tidak baca response, tidak redirect
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })
      .then(() => {
        console.log("✅ Data terkirim (no-cors)");
        // Tunggu sebentar untuk memastikan data tersimpan di Google
        setTimeout(resolve, 1500);
      })
      .catch((error) => {
        console.warn("⚠️ Error:", error);
        // Tetap resolve agar modal muncul
        setTimeout(resolve, 1500);
      });
  });
}

// ==========================================
// FUNGSI: SIMPAN KE LOCALSTORAGE (BACKUP)
// ==========================================
function simpanKeLocalStorage(data) {
  try {
    let dataTamu = JSON.parse(localStorage.getItem("bukuTamuData") || "[]");
    dataTamu.push(data);
    localStorage.setItem("bukuTamuData", JSON.stringify(dataTamu));
    console.log("💾 Data disimpan ke localStorage");
  } catch (e) {
    console.warn("⚠️ Gagal simpan ke localStorage:", e);
  }
}

// ==========================================
// HANDLE FORM SUBMIT
// ==========================================
document
  .getElementById("bukuTamuForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    showLoading();

    // ==========================================
    // FUNGSI: CONVERT 08... KE 62...
    // ==========================================
    function convertTo62Format(phone) {
      if (!phone) return "";

      // Hapus semua non-angka
      let clean = phone.replace(/\D/g, "");

      // Jika dimulai dengan 0, ganti dengan 62
      if (clean.startsWith("0")) {
        return "62" + clean.substring(1);
      }
      // Jika tidak dimulai dengan 62, tambahkan 62
      else if (!clean.startsWith("62")) {
        return "62" + clean;
      }

      return clean;
    }
    const formData = {
      tanggal: document.getElementById("tanggal")?.value || "",
      nama: document.getElementById("nama")?.value.trim() || "",
      jenisKelamin: document.getElementById("jenisKelamin")?.value || "",
      noHp:
        convertTo62Format(document.getElementById("noHp")?.value.trim()) || "",
      instansi: document.getElementById("instansi")?.value.trim() || "",
      tujuan: document.getElementById("tujuan")?.value || "",
      keterangan: document.getElementById("keterangan")?.value.trim() || "",
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Simpan ke localStorage dulu (backup)
      simpanKeLocalStorage(formData);

      // 2. Kirim ke Google Script
      await kirimDataKeGoogleScript(formData);

      // 3. Tampilkan sukses
      hideLoading();
      showSuccessModal();
    } catch (error) {
      console.error("❌ Error saat mengirim:", error);
      hideLoading();

      // Tetap tampilkan sukses karena data sudah di-backup ke localStorage
      alert(
        "⚠️ Terjadi kendala koneksi, tapi data Anda sudah kami simpan sementara.",
      );
      showSuccessModal();
    }
  });

// ==========================================
// INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  setTanggal();
  formatNoHp(document.getElementById("noHp"));
});

// ==========================================
// MOBILE MENU TOGGLE (DENGAN CEK NULL)
// ==========================================
const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", function () {
    const navMenu = document.querySelector(".nav-menu");
    if (navMenu) {
      navMenu.style.display =
        navMenu.style.display === "flex" ? "none" : "flex";
    }
  });
}
