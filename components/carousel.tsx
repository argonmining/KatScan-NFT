'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Carousel01 from '@/public/images/carousel-01.jpg'
import Carousel02 from '@/public/images/carousel-02.jpg'
import Carousel03 from '@/public/images/carousel-03.jpg'
import Carousel04 from '@/public/images/carousel-04.jpg'
import Carousel05 from '@/public/images/carousel-05.jpg'
import Carousel06 from '@/public/images/carousel-06.jpg'
import Carousel07 from '@/public/images/carousel-07.jpg'
import Carousel08 from '@/public/images/carousel-08.jpg'
import Avatar01 from '@/public/images/carousel-avatar-01.jpg'
import Avatar02 from '@/public/images/carousel-avatar-02.jpg'
import Avatar03 from '@/public/images/carousel-avatar-03.jpg'
import Avatar04 from '@/public/images/carousel-avatar-04.jpg'
import Avatar05 from '@/public/images/carousel-avatar-05.jpg'
import Avatar06 from '@/public/images/carousel-avatar-06.jpg'
import Avatar07 from '@/public/images/carousel-avatar-07.jpg'
import Avatar08 from '@/public/images/carousel-avatar-08.jpg'
import Avatar09 from '@/public/images/carousel-avatar-09.jpg'
import Avatar10 from '@/public/images/carousel-avatar-10.jpg'
import Avatar11 from '@/public/images/carousel-avatar-11.jpg'
import Avatar12 from '@/public/images/carousel-avatar-12.jpg'
import Avatar13 from '@/public/images/carousel-avatar-13.jpg'
import Avatar14 from '@/public/images/carousel-avatar-14.jpg'
import Avatar15 from '@/public/images/carousel-avatar-15.jpg'
import Avatar16 from '@/public/images/carousel-avatar-16.jpg'
import Avatar17 from '@/public/images/carousel-avatar-17.jpg'
import Avatar18 from '@/public/images/carousel-avatar-18.jpg'

// Import Swiper
import Swiper, { Navigation } from 'swiper'
import 'swiper/swiper.min.css'
Swiper.use([Navigation])

export default function Carousel() {

  useEffect(() => {
    const carousel = new Swiper('.carousel', {
      breakpoints: {
        320: {
          slidesPerView: 1,
        },
        640: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 4,
        },
      },
      grabCursor: true,
      loop: false,
      centeredSlides: false,
      initialSlide: 0,
      spaceBetween: 24,
      watchSlidesProgress: true,
      navigation: {
        nextEl: '.carousel-next',
        prevEl: '.carousel-prev',
      },
    })
  }, [])

  return (
    <section className="bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
            <h2 className="text-4xl font-bold text-white mb-4">Popular Collections</h2>
            <p className="text-xl text-gray-400">Discover the most traded NFT collections on the platform</p>
          </div>

          {/* Carousel built with Swiper.js */}
          <div className="carousel swiper-container">
            <div className="swiper-wrapper">
              {/* Carousel slides */}
              <div className="swiper-slide h-auto">
                <div className="relative flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
                  <Image 
                    className="w-full aspect-[7/4] object-cover rounded-lg"
                    src={Carousel01}
                    width={259}
                    height={148}
                    alt="Carousel 01"
                  />
                  <div className="grow px-4 pb-6">
                    {/* Avatars */}
                    <div className="flex items-start -space-x-3 -ml-0.5 mb-4 -mt-5">
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar01}
                        width={36}
                        height={36}
                        alt="Avatar 01"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar02}
                        width={36}
                        height={36}
                        alt="Avatar 02"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar03}
                        width={36}
                        height={36}
                        alt="Avatar 03"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar04}
                        width={36}
                        height={36}
                        alt="Avatar 04"
                      />
                    </div>
                    {/* Title */}
                    <a className="inline-block font-bold text-xl text-white hover:text-blue-400 transition-colors" 
                       href="#0">
                      Digital Art
                    </a>
                    <div className="text-sm text-gray-400 italic">
                      34 collections
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide h-auto">
                <div className="relative flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
                  <Image 
                    className="w-full aspect-[7/4] object-cover rounded-lg"
                    src={Carousel02}
                    width={259}
                    height={148}
                    alt="Carousel 02"
                  />
                  <div className="grow px-4 pb-6">
                    {/* Avatars */}
                    <div className="flex items-start -space-x-3 -ml-0.5 mb-4 -mt-5">
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar05}
                        width={36}
                        height={36}
                        alt="Avatar 05"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar06}
                        width={36}
                        height={36}
                        alt="Avatar 06"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar07}
                        width={36}
                        height={36}
                        alt="Avatar 07"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar08}
                        width={36}
                        height={36}
                        alt="Avatar 08"
                      />
                    </div>
                    {/* Title */}
                    <a className="inline-block font-bold text-xl text-white hover:text-blue-400 transition-colors" 
                       href="#0">
                      Gradients
                    </a>
                    <div className="text-sm text-gray-400 italic">
                      129 collections
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide h-auto">
                <div className="relative flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
                  <Image 
                    className="w-full aspect-[7/4] object-cover rounded-lg"
                    src={Carousel03}
                    width={259}
                    height={148}
                    alt="Carousel 03"
                  />
                  <div className="grow px-4 pb-6">
                    {/* Avatars */}
                    <div className="flex items-start -space-x-3 -ml-0.5 mb-4 -mt-5">
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar09}
                        width={36}
                        height={36}
                        alt="Avatar 09"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar08}
                        width={36}
                        height={36}
                        alt="Avatar 08"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar10}
                        width={36}
                        height={36}
                        alt="Avatar 10"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar11}
                        width={36}
                        height={36}
                        alt="Avatar 11"
                      />
                    </div>
                    {/* Title */}
                    <a className="inline-block font-bold text-xl text-white hover:text-blue-400 transition-colors" 
                       href="#0">
                      Liquid 3D
                    </a>
                    <div className="text-sm text-gray-400 italic">
                      49 collections
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide h-auto">
                <div className="relative flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
                  <Image 
                    className="w-full aspect-[7/4] object-cover rounded-lg"
                    src={Carousel04}
                    width={259}
                    height={148}
                    alt="Carousel 04"
                  />
                  <div className="grow px-4 pb-6">
                    {/* Avatars */}
                    <div className="flex items-start -space-x-3 -ml-0.5 mb-4 -mt-5">
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar18}
                        width={36}
                        height={36}
                        alt="Avatar 18"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar08}
                        width={36}
                        height={36}
                        alt="Avatar 08"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar01}
                        width={36}
                        height={36}
                        alt="Avatar 01"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar11}
                        width={36}
                        height={36}
                        alt="Avatar 11"
                      />
                    </div>
                    {/* Title */}
                    <a className="inline-block font-bold text-xl text-white hover:text-blue-400 transition-colors" 
                       href="#0">
                      Abstraction
                    </a>
                    <div className="text-sm text-gray-400 italic">
                      24 collections
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide h-auto">
                <div className="relative flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
                  <Image 
                    className="w-full aspect-[7/4] object-cover rounded-lg"
                    src={Carousel05}
                    width={259}
                    height={148}
                    alt="Carousel 05"
                  />
                  <div className="grow px-4 pb-6">
                    {/* Avatars */}
                    <div className="flex items-start -space-x-3 -ml-0.5 mb-4 -mt-5">
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar09}
                        width={36}
                        height={36}
                        alt="Avatar 09"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar12}
                        width={36}
                        height={36}
                        alt="Avatar 12"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar13}
                        width={36}
                        height={36}
                        alt="Avatar 13"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar14}
                        width={36}
                        height={36}
                        alt="Avatar 14"
                      />
                    </div>
                    {/* Title */}
                    <a className="inline-block font-bold text-xl text-white hover:text-blue-400 transition-colors" 
                       href="#0">
                      Landscapes
                    </a>
                    <div className="text-sm text-gray-400 italic">
                      27 collections
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide h-auto">
                <div className="relative flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
                  <Image 
                    className="w-full aspect-[7/4] object-cover rounded-lg"
                    src={Carousel06}
                    width={259}
                    height={148}
                    alt="Carousel 06"
                  />
                  <div className="grow px-4 pb-6">
                    {/* Avatars */}
                    <div className="flex items-start -space-x-3 -ml-0.5 mb-4 -mt-5">
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar15}
                        width={36}
                        height={36}
                        alt="Avatar 01"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar11}
                        width={36}
                        height={36}
                        alt="Avatar 11"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar16}
                        width={36}
                        height={36}
                        alt="Avatar 16"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar17}
                        width={36}
                        height={36}
                        alt="Avatar 17"
                      />
                    </div>
                    {/* Title */}
                    <a className="inline-block font-bold text-xl text-white hover:text-blue-400 transition-colors" 
                       href="#0">
                      Pastel
                    </a>
                    <div className="text-sm text-gray-400 italic">
                      22 collections
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide h-auto">
                <div className="relative flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
                  <Image 
                    className="w-full aspect-[7/4] object-cover rounded-lg"
                    src={Carousel07}
                    width={259}
                    height={148}
                    alt="Carousel 07"
                  />
                  <div className="grow px-4 pb-6">
                    {/* Avatars */}
                    <div className="flex items-start -space-x-3 -ml-0.5 mb-4 -mt-5">
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar09}
                        width={36}
                        height={36}
                        alt="Avatar 09"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar18}
                        width={36}
                        height={36}
                        alt="Avatar 18"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar10}
                        width={36}
                        height={36}
                        alt="Avatar 10"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar05}
                        width={36}
                        height={36}
                        alt="Avatar 05"
                      />
                    </div>
                    {/* Title */}
                    <a className="inline-block font-bold text-xl text-white hover:text-blue-400 transition-colors" 
                       href="#0">
                      Dark 3D
                    </a>
                    <div className="text-sm text-gray-400 italic">
                      112 collections
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide h-auto">
                <div className="relative flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
                  <Image 
                    className="w-full aspect-[7/4] object-cover rounded-lg"
                    src={Carousel08}
                    width={259}
                    height={148}
                    alt="Carousel 08"
                  />
                  <div className="grow px-4 pb-6">
                    {/* Avatars */}
                    <div className="flex items-start -space-x-3 -ml-0.5 mb-4 -mt-5">
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar06}
                        width={36}
                        height={36}
                        alt="Avatar 06"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar05}
                        width={36}
                        height={36}
                        alt="Avatar 05"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar08}
                        width={36}
                        height={36}
                        alt="Avatar 08"
                      />
                      <Image 
                        className="rounded-full border-2 border-[#0a0b0f] box-content"
                        src={Avatar07}
                        width={36}
                        height={36}
                        alt="Avatar 07"
                      />
                    </div>
                    {/* Title */}
                    <a className="inline-block font-bold text-xl text-white hover:text-blue-400 transition-colors" 
                       href="#0">
                      Baroque
                    </a>
                    <div className="text-sm text-gray-400 italic">
                      77 collections
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Navigation */}
          <div className="flex mt-12 space-x-4 justify-end">
            <button className="carousel-prev w-14 h-14 rounded-full flex items-center justify-center 
                             bg-transparent hover:bg-blue-500/20 transition-colors border border-gray-800">
              <span className="sr-only">Previous</span>
              <svg className="w-4 h-4 fill-gray-400 group-hover:fill-white transition-colors" 
                   viewBox="0 0 16 16">
                <path d="M6.7 14.7l1.4-1.4L3.8 9H16V7H3.8l4.3-4.3-1.4-1.4L0 8z" />
              </svg>
            </button>
            <button className="carousel-next w-14 h-14 rounded-full flex items-center justify-center 
                             bg-transparent hover:bg-blue-500/20 transition-colors border border-gray-800">
              <span className="sr-only">Next</span>
              <svg className="w-4 h-4 fill-gray-400 group-hover:fill-white transition-colors" 
                   viewBox="0 0 16 16">
                <path d="M9.3 14.7l-1.4-1.4L12.2 9H0V7h12.2L7.9 2.7l1.4-1.4L16 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}