export interface Application {
  _id: string;
  userId: string | { _id: string; email: string };
  firstName: string;
  lastName: string;
  email: string;
  birthdate: string;
  gender: string;
  passportNumber: string;
  passportIssuingCountry: string;
  passportExpirationDate: string;
  dateOfArrival: string;
  dateOfDeparture: string;
  companyName: string;
  position: string;
  companyMailingAddress1: string;
  companyMailingAddress2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  fax?: string;
  hotelName?: string;
  hotelConfirmation?: string;
  additionalInformation?: string;
  status: 'pending' | 'complete' | 'rejected';
  letterEmailed: boolean;
  hardCopyMailed: boolean;
  hardCopyMailedDate?: string;
  addressToMailHardCopy?: string;
  meeting: { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export interface Meeting {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  isActive: boolean;
} 