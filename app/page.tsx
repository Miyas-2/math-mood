import { BookOpen, Brain, GraduationCap, Heart, Sparkles, Volume2, FileText, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl">MoodMath</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Daftar Gratis
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Belajar Matematika dengan AI
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Belajar Matematika yang Memahami Perasaanmu
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            MoodMath menggunakan AI untuk mendeteksi emosimu dan menyesuaikan cara mengajar.
            Belajar jadi lebih menyenangkan dan tidak membuat stres!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Mulai Belajar Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium border border-border rounded-xl hover:bg-muted transition-colors"
            >
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Kenapa MoodMath?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Fitur-fitur yang membuat belajar matematika jadi berbeda
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-xl bg-rose-500/10 w-fit mb-4">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Deteksi Emosi</h3>
            <p className="text-muted-foreground text-sm">
              AI kami mendeteksi perasaanmu dari feedback yang kamu berikan dan menyesuaikan cara mengajar.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-xl bg-violet-500/10 w-fit mb-4">
              <Volume2 className="w-6 h-6 text-violet-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Mode Audio & Teks</h3>
            <p className="text-muted-foreground text-sm">
              Pilih cara belajar yang nyaman. Mode audio dengan text-to-speech atau mode teks dengan markdown.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-4">
              <GraduationCap className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Kurikulum Lengkap</h3>
            <p className="text-muted-foreground text-sm">
              Materi lengkap untuk SMP dan SMA sesuai kurikulum nasional, dari aljabar sampai statistika.
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Materi yang Tersedia</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Pilih jenjang pendidikanmu dan mulai belajar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Kelas 9 */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">SMP Kelas IX</h3>
                  <p className="text-sm text-muted-foreground">8 Bab</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Penjabaran & Pemfaktoran</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Akar Kuadrat</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Persamaan Kuadrat</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Fungsi y = ax²</li>
                <li className="text-xs">+4 bab lainnya</li>
              </ul>
            </div>

            {/* Kelas 10 */}
            <div className="p-6 rounded-2xl border border-border bg-card opacity-60">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <BookOpen className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">SMA Kelas X</h3>
                  <p className="text-sm text-muted-foreground">Segera Hadir</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Materi SMA Kelas 10 sedang dalam pengembangan.
              </p>
            </div>

            {/* Kelas 11-12 */}
            <div className="p-6 rounded-2xl border border-border bg-card opacity-60">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <BookOpen className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">SMA Kelas XI-XII</h3>
                  <p className="text-sm text-muted-foreground">Segera Hadir</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Materi SMA Kelas 11-12 sedang dalam pengembangan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Siap Mulai Belajar?</h2>
          <p className="text-muted-foreground mb-8">
            Daftar gratis dan mulai belajar matematika dengan cara yang lebih menyenangkan!
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            Daftar Sekarang - Gratis!
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold">MoodMath</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 MoodMath. Dibuat dengan ❤️ untuk pelajar Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}
