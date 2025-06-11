import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';

const environment = {
  firebase: {
    apiKey: "AIzaSyA5B5fIft7Oh7SDSMje6ixLwFl-yaxen-Q",
    authDomain: "timywimy-226a3.firebaseapp.com",
    projectId: "timywimy-226a3",
    storageBucket: "timywimy-226a3.firebasestorage.app",
    messagingSenderId: "346136714070",
    appId: "1:346136714070:web:32e5928d77559cacfc54f7",
    measurementId: "G-1Y8EMDE3H4"
  }
};
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
  ]
};
