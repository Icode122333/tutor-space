import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const HeroSection = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const images = [
        "/image1.jpg",
        "/image2.jpg",
        "/image3.jpg"
    ];

    // Auto-advance slider every 4 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section id="home" className="relative min-h-[90vh] flex items-center bg-white overflow-hidden pt-20">

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-green-50 to-transparent z-0 hidden lg:block" />
            <div className="absolute top-20 right-20 w-96 h-96 bg-[#006d2c]/5 rounded-full blur-3xl z-0" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
                            <span className="w-2 h-2 bg-[#006d2c] rounded-full animate-pulse" />
                            <span className="text-xs font-semibold text-[#006d2c] uppercase tracking-wide">
                                Build practical skills
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-gray-900 font-poppins">
                            Build Practical <span className="text-[#006d2c]">Data, AI</span>, and <span className="text-[#006d2c]">Project Skills</span> for Today's Workforce
                        </h1>

                        <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl">
                            DATA+ empowers professionals across Africa with hands-on training in data science, AI,
                            monitoring & evaluation, and project management delivered through expert-led cohorts and
                            real-world capstone projects.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => navigate("/courses")}
                                className="bg-[#006d2c] hover:bg-[#005523] text-white px-8 py-6 text-base font-semibold shadow-xl shadow-green-900/10 transition-all hover:scale-105"
                            >
                                Browse Courses
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button
                                onClick={() => document.getElementById("partner-dialog")?.click()}
                                variant="outline"
                                className="border-2 border-gray-200 text-gray-700 hover:border-[#006d2c] hover:text-[#006d2c] px-8 py-6 text-base font-semibold transition-all"
                            >
                                Partner With Us
                            </Button>
                        </div>

                        <div className="border-t border-gray-100 pt-8">
                            <p className="text-sm font-medium text-gray-500 mb-4">
                                Trusted by professionals and institutions in Rwanda and across Africa
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#006d2c]" />
                                    <span>Expert-led Cohorts</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#006d2c]" />
                                    <span>Hands-on Capstones</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#006d2c]" />
                                    <span>Practical Certification</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Image Slider */}
                    <div className="relative hidden lg:block h-[450px] w-full rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
                        {images.map((image, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"
                                    }`}
                            >
                                <img
                                    src={image}
                                    alt={`Slide ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        {/* Glassmorphism Badges */}
                        <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 shadow-lg">
                            <p className="text-white text-sm font-semibold">Best Platform in Rwanda</p>
                        </div>



                        {/* Slide Indicators */}
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                        ? "bg-white w-8"
                                        : "bg-white/50 hover:bg-white/75"
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>



                    </div>
                </div>
            </div>
        </section>
    );
};
