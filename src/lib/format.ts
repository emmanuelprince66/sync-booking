
/** "Tuesday, 26 August 2025" — the header date format. */
export const formatLongDate = (date = new Date()) =>
  date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const greeting = (date = new Date()) => {
  const hour = date.getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

/** "KO" from "Kemi Okafor". */
export const initials = (name: string) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
