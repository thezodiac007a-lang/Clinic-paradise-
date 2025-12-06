import { Option } from '../types';

export interface ScriptNode {
  id: string;
  text: string;
  options: Option[];
}

export const chatScript: Record<string, ScriptNode> = {
  'start': {
    id: 'start',
    text: "Welcome to City Health! How can I assist you today?",
    options: [
      { label: "Book Appointment", nextId: 'book_appt' },
      { label: "Check Clinic Hours", nextId: 'hours' },
      { label: "Location & Contact", nextId: 'location' },
      { label: "Prescription Info", nextId: 'prescription' }
    ]
  },
  'book_appt': {
    id: 'book_appt',
    text: "I can help with that. Which department would you like to visit?",
    options: [
      { label: "Cardiology (Dr. Smith)", nextId: 'cardio_time' },
      { label: "Dermatology (Dr. Jones)", nextId: 'derm_time' },
      { label: "Go Back", nextId: 'start' }
    ]
  },
  'cardio_time': {
    id: 'cardio_time',
    text: "Dr. Smith is available Mon-Fri, 9 AM - 5 PM. What works best?",
    options: [
      { label: "Morning (9 AM - 12 PM)", nextId: 'confirm_booking' },
      { label: "Afternoon (1 PM - 5 PM)", nextId: 'confirm_booking' },
      { label: "Different Doctor", nextId: 'book_appt' }
    ]
  },
  'derm_time': {
    id: 'derm_time',
    text: "Dr. Jones is available Tue-Thu, 10 AM - 4 PM. What works best?",
    options: [
      { label: "Morning (10 AM - 12 PM)", nextId: 'confirm_booking' },
      { label: "Afternoon (1 PM - 4 PM)", nextId: 'confirm_booking' },
      { label: "Different Doctor", nextId: 'book_appt' }
    ]
  },
  'confirm_booking': {
    id: 'confirm_booking',
    text: "Please call us at (555) 123-4567 to finalize your specific slot, or leave your phone number here and we will call you back.",
    options: [
      { label: "I'll call you", nextId: 'final_thanks' },
      { label: "Back to Menu", nextId: 'start' }
    ]
  },
  'hours': {
    id: 'hours',
    text: "We are open Monday through Friday, 8:00 AM to 6:00 PM. We are closed on weekends and public holidays.",
    options: [
      { label: "Book Appointment", nextId: 'book_appt' },
      { label: "Location", nextId: 'location' },
      { label: "Back to Menu", nextId: 'start' }
    ]
  },
  'location': {
    id: 'location',
    text: "We are located at 123 Medical Center Blvd, Suite 100, Metropolis. There is free parking in the rear.",
    options: [
      { label: "Check Hours", nextId: 'hours' },
      { label: "Back to Menu", nextId: 'start' }
    ]
  },
  'prescription': {
    id: 'prescription',
    text: "Please note I am an automated assistant. For specific prescription renewals, please use our patient portal or call the pharmacy desk.",
    options: [
      { label: "Patient Portal Link", nextId: 'portal_info' },
      { label: "Back to Menu", nextId: 'start' }
    ]
  },
  'portal_info': {
    id: 'portal_info',
    text: "You can access the portal at www.cityhealth-portal.com using your Patient ID.",
    options: [
      { label: "Back to Menu", nextId: 'start' }
    ]
  },
  'final_thanks': {
    id: 'final_thanks',
    text: "Thank you for choosing City Health. Have a wonderful day!",
    options: [
      { label: "Start Over", nextId: 'start' }
    ]
  },
  'unknown': {
    id: 'unknown',
    text: "I didn't understand that. Please select one of the options below.",
    options: [
      { label: "Start Over", nextId: 'start' }
    ]
  }
};