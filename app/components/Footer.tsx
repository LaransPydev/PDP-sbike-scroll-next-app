// app/components/Footer.tsx
"use client";

import React from "react";

/* ==================== FOOTER DATA ==================== */
const SERVICE_LINKS = [
    { label: "Kundenservice", href: "/kundenservice" },
    { label: "Mein Konto", href: "/account" },
    { label: "Versandbedingungen", href: "/versand" },
    { label: "Zahlarten", href: "/zahlarten" },
    { label: "Entsorgung", href: "/entsorgung" },
];

const LEGAL_LINKS = [
    { label: "Allgemeine Geschäftsbedingungen", href: "/agb" },
    { label: "Datenschutzerklärung", href: "/datenschutz" },
    { label: "Sportstech Live Datenschutzerklärung", href: "/live-datenschutz" },
    { label: "Widerrufsbelehrung**", href: "/widerruf" },
    { label: "Impressum", href: "/impressum" },
    { label: "Cookie Einstellungen", href: "/cookies" },
    { label: "Digitale Barrierefreiheit", href: "/barrierefreiheit" },
];

const COMPANY_LINKS = [
    { label: "Über Uns", href: "/ueber-uns" },
    { label: "Jobs & Karriere", href: "/jobs" },
    { label: "sLine Kampagne: Zeit für Neues", href: "/sline" },
    { label: "Affiliate Programm", href: "/affiliate" },
    { label: "Blog", href: "/blog" },
];

const PAYMENT_METHODS = [
    { name: "PayPal Express", src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
    { name: "PayPal", src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
    { name: "Trustly", src: "https://cdn.worldvectorlogo.com/logos/trustly-2.svg" },
    { name: "Apple Pay", src: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" },
    { name: "Klarna", src: "https://upload.wikimedia.org/wikipedia/commons/4/40/Klarna_Payment_Badge.svg" },
    { name: "Klarna Rechnung", src: "https://upload.wikimedia.org/wikipedia/commons/4/40/Klarna_Payment_Badge.svg" },
    { name: "Visa", src: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
    { name: "Mastercard", src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
    { name: "PayPal 2", src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
    { name: "SEPA", src: "https://upload.wikimedia.org/wikipedia/commons/8/89/SEPA_logo.svg" },
];

const SOCIAL_LINKS = [
    {
        name: "Instagram",
        href: "https://instagram.com/sportstech",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
        ),
    },
    {
        name: "Facebook",
        href: "https://facebook.com/sportstech",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
        ),
    },
    {
        name: "YouTube",
        href: "https://youtube.com/sportstech",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#0f1419" />
            </svg>
        ),
    },
    {
        name: "TikTok",
        href: "https://tiktok.com/@sportstech",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.89 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.14 15.67 6.34 6.34 0 0 0 9.48 22a6.34 6.34 0 0 0 6.34-6.34V9.41a8.16 8.16 0 0 0 4.77 1.52V7.51a4.85 4.85 0 0 1-1-.82z" />
            </svg>
        ),
    },
];

/* ==================== TRUSTPILOT STARS ==================== */
const TrustpilotStars = () => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="w-6 h-6 flex items-center justify-center bg-[#00b67a]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            </div>
        ))}
    </div>
);

/* ==================== COLUMN HEADING ==================== */
const ColHeading = ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-xs font-bold tracking-[0.12em] text-gray-100 uppercase italic mb-5">
        {children}
    </h4>
);

/* ==================== LINK ITEM ==================== */
const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <li>
        <a href={href} className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
            {children}
        </a>
    </li>
);

/* ==================== FOOTER COMPONENT ==================== */
export default function FooterSection() {
    return (
        <footer className="bg-[#0f1419] text-gray-300">

            {/* ── Trustpilot bar ── */}
            <div className="border-b border-white/[0.06] py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <img src="/logo-footer_(5).svg" alt="Sportstech Logo" />
                    </div>
                    <span className="text-[15px] font-semibold text-gray-100 tracking-tight">
                        Hervorragend
                    </span>
                    <TrustpilotStars />
                    <a
                        href="https://www.trustpilot.com/review/sportstech.de"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 no-underline"
                    >
                        <span className="text-sm text-gray-400 underline underline-offset-2">
                            6.402 Bewertungen auf
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#00b67a">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="text-sm font-bold text-gray-100 tracking-tight">
                            Trustpilot
                        </span>
                    </a>
                </div>
            </div>

            {/* ── Main footer grid ── */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">

                    {/* Column 1: SERVICE */}
                    <div>
                        <ColHeading>Service</ColHeading>
                        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                            {SERVICE_LINKS.map((link) => (
                                <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2: RECHTLICHE HINWEISE */}
                    <div>
                        <ColHeading>Rechtliche Hinweise</ColHeading>
                        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                            {LEGAL_LINKS.map((link) => (
                                <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: UNTERNEHMEN */}
                    <div>
                        <ColHeading>Unternehmen</ColHeading>
                        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                            {COMPANY_LINKS.map((link) => (
                                <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: ZAHLUNGSMETHODEN */}
                    <div>
                        <ColHeading>Zahlungsmethoden</ColHeading>
                        <div className="grid grid-cols-2 gap-2 max-w-[200px]">
                            {PAYMENT_METHODS.map((pm, idx) => (
                                <div
                                    key={`${pm.name}-${idx}`}
                                    className="flex items-center justify-center rounded-md bg-white h-9 px-2"
                                >
                                    <img
                                        src={pm.src}
                                        alt={pm.name}
                                        className="max-w-[70px] max-h-6 object-contain"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 5: FOLGE UNS */}
                    <div>
                        <ColHeading>Folge Uns</ColHeading>
                        <div className="flex items-center gap-3">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.name}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-white/15 text-gray-300 hover:border-white hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar ── */}
            <div className="border-t border-white/[0.06] py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">

                    <span className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Sportstech Brands Holding GmbH. Alle Rechte vorbehalten.
                    </span>
                </div>
            </div>
        </footer>
    );
}