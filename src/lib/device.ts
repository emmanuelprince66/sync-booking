/** Touch-first devices (phones, tablets): focusing a text box there opens the on-screen keyboard. */
export const isCoarsePointer = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
