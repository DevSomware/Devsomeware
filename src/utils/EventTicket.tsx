"use client"
import type React from "react"
import { motion } from "framer-motion"
import { CalendarDays, MapPin, User, Download } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Image from "next/image"
import * as htmlToImage from 'html-to-image'
import { saveAs } from 'file-saver'
import { Button } from "@/components/ui/button"
import { useRef } from "react"

interface EventTicketProps {
  eventName: string
  date: string
  location: string
  ticketId: string
  name: string
}

const EventTicket: React.FC<EventTicketProps> = ({
  name,
  date,
  location,
  ticketId
}) => {
  const ticketRef = useRef<HTMLDivElement>(null)

  const downloadTicket = async () => {
    if (ticketRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(ticketRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          filter: (node) => {
            // Ensure backdrop-filter and background effects are captured
            if (node instanceof HTMLElement) {
              const style = window.getComputedStyle(node)
              if (style.backdropFilter) {
                const currentBg = style.backgroundColor
                // Preserve the original background color with opacity
                node.style.backgroundColor = currentBg
              }
            }
            return true
          },
          // Capture background effects
          // Ensure all CSS is captured
          style: {
            transformOrigin: 'center',
            transform: 'none'
          }
        })
        saveAs(dataUrl, `ticket-${ticketId}.png`)
      } catch (error) {
        console.error('Error downloading ticket:', error)
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div
        ref={ticketRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-auto my-8"
      >
        <div className="relative overflow-hidden rounded-2xl bg-purple-900 bg-opacity-40 backdrop-blur-sm shadow-2xl border border-silver-500 border-rounded-lg">
          {/* Ticket Content */}
          <div className="relative p-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-white"
            >
              <div className="flex items-center -ml-4 sm:space-x-[15px] lg:space-x-[100px] text-4xl font-extrabold mb-5 tracking-tight">
                <Image src="https://res.cloudinary.com/db0x5vhbk/image/upload/v1738404422/kzcvx5u7yl4tdbcs9ajm.png" width={200} height={50} alt="Zenotrone Logo" />
                <Image src="https://res.cloudinary.com/db0x5vhbk/image/upload/v1738515816/ptstyvnggxzyb9xatpfv.png" width={100} height={50} alt="Zenotrone Logo" />
              </div>

              <div className="flex items-center mb-2">
                <User className="w-5 h-5 mr-2" />
                <p className="text-xl">{name}</p>
              </div>
              <div className="flex items-center mb-2">
                <CalendarDays className="w-5 h-5 mr-2" />
                <p className="text-xl">{date}</p>
              </div>
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <p className="text-xl">{location}</p>
              </div>
            </motion.div>

            {/* QR Code */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-white p-4 rounded-lg inline-block mb-4 shadow-lg"
            >
              <QRCodeSVG value={ticketId} size={128} />
            </motion.div>

            {/* Ticket ID */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-white text-sm"
            >
              <span className="font-semibold">Ticket ID:</span> {ticketId}
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white bg-opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <Image src="https://res.cloudinary.com/db0x5vhbk/image/upload/v1738516094/uiszlmu5jm2ijupnqyav.png" width={1000} height={50} alt="textile Logo" />
        </div>
      </motion.div>

      {/* Download Button */}
      <Button
        onClick={downloadTicket}
        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download Ticket
      </Button>
    </div>
  )
}

export default EventTicket