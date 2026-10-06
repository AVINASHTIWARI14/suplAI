import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export const LANGUAGE_STORAGE_KEY = 'suplai-language';

export const LANGUAGES = [
  { code: 'en', label: 'English', country: 'United States', flag: '🇺🇸', locale: 'en-US' },
  { code: 'hi', label: 'हिन्दी', country: 'India', flag: '🇮🇳', locale: 'hi-IN' },
  { code: 'es', label: 'Español', country: 'Spain', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'fr', label: 'Français', country: 'France', flag: '🇫🇷', locale: 'fr-FR' },
  { code: 'de', label: 'Deutsch', country: 'Germany', flag: '🇩🇪', locale: 'de-DE' },
  { code: 'pt', label: 'Português', country: 'Brazil', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'ja', label: '日本語', country: 'Japan', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'zh', label: '中文', country: 'China', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'ar', label: 'العربية', country: 'United Arab Emirates', flag: '🇦🇪', locale: 'ar-AE' },
];

const COMMON = {
  hi: {
    Dashboard: 'डैशबोर्ड', Suppliers: 'सप्लायर्स', Network: 'नेटवर्क', Alternatives: 'विकल्प',
    Disruptions: 'व्यवधान', Alerts: 'अलर्ट्स', Settings: 'सेटिंग्स',
    'Settings & Integration': 'सेटिंग्स और इंटीग्रेशन', 'Settings & Data': 'सेटिंग्स और डेटा',
    Login: 'लॉगिन', Logout: 'लॉगआउट', 'Select company': 'कंपनी चुनें',
    'Open user menu': 'यूज़र मेन्यू खोलें', 'Primary navigation': 'मुख्य नेविगेशन',
    Companies: 'कंपनियां', 'Supplier Explorer': 'सप्लायर एक्सप्लोरर',
    'Network & Simulation': 'नेटवर्क और सिमुलेशन', 'Disruption Feed': 'डिसरप्शन फीड',
    'How to use?': 'कैसे उपयोग करें?', 'Active Disruptions': 'सक्रिय व्यवधान',
    'Risky Suppliers': 'जोखिम वाले सप्लायर्स', 'Risk Score Trend': 'रिस्क स्कोर ट्रेंड',
    'Overall supply-chain risk over time': 'समय के साथ कुल सप्लाई-चेन जोखिम',
    Time: 'समय', 'Risk Score': 'रिस्क स्कोर', 'View all disruptions': 'सभी व्यवधान देखें',
    'View all suppliers': 'सभी सप्लायर्स देखें', 'Open disruption center': 'डिसरप्शन सेंटर खोलें',
    'No active disruptions': 'कोई सक्रिय व्यवधान नहीं', 'No risky suppliers found': 'कोई जोखिम वाला सप्लायर नहीं मिला',
    'No feed items': 'कोई फीड आइटम नहीं', 'No risk trend data available': 'रिस्क ट्रेंड डेटा उपलब्ध नहीं है',
    High: 'उच्च', Medium: 'मध्यम', Low: 'कम', 'High Risk Suppliers': 'उच्च जोखिम वाले सप्लायर्स',
    'Medium Risk': 'मध्यम जोखिम', 'Low Risk': 'कम जोखिम', 'Total Suppliers': 'कुल सप्लायर्स',
    'Cost Index': 'कॉस्ट इंडेक्स', 'Lead Time': 'लीड टाइम', Country: 'देश', Reset: 'रीसेट',
    'Search suppliers...': 'सप्लायर्स खोजें...', 'No suppliers match your filters.': 'आपके फ़िल्टर से कोई सप्लायर नहीं मिलता।',
    'Try widening the risk, cost, or lead-time limits.': 'रिस्क, कॉस्ट या लीड-टाइम सीमाएं बढ़ाकर देखें।',
    'Search alternative suppliers...': 'वैकल्पिक सप्लायर्स खोजें...', 'Search alternative suppliers': 'वैकल्पिक सप्लायर्स खोजें',
    Rank: 'रैंक', Supplier: 'सप्लायर', Location: 'स्थान', Risk: 'रिस्क', Composite: 'कम्पोज़िट',
    Global: 'वैश्विक', 'Unknown Supplier': 'अज्ञात सप्लायर',
    'No alternative suppliers match your search.': 'आपकी खोज से कोई वैकल्पिक सप्लायर नहीं मिलता।',
    'No alternative suppliers for this company.': 'इस कंपनी के लिए कोई वैकल्पिक सप्लायर नहीं है।',
    SUPPLIERS: 'सप्लायर्स', 'Click a node to inspect it and toggle its disruption state.': 'किसी नोड पर क्लिक करके उसे देखें और उसका डिसरप्शन स्टेट बदलें।',
    'Run simulation': 'सिमुलेशन चलाएं', 'Run Simulation': 'सिमुलेशन चलाएं',
    'Reset simulation': 'सिमुलेशन रीसेट करें', 'Select a supplier to simulate a disruption.': 'डिसरप्शन सिमुलेट करने के लिए सप्लायर चुनें।',
    'Selected disruption nodes': 'चयनित डिसरप्शन नोड्स', 'Network Risk': 'नेटवर्क रिस्क',
    'Risk before': 'पहले का जोखिम', 'Risk after': 'बाद का जोखिम', 'Nodes affected': 'प्रभावित नोड्स',
    'Critical paths broken': 'टूटे क्रिटिकल पाथ', 'Locate an address': 'पता खोजें',
    'Resolve any address to coordinates via the geocoding service — use this when registering a new supplier or facility.': 'जियोकोडिंग सेवा के ज़रिए किसी भी पते को निर्देशांकों में बदलें — नए सप्लायर या सुविधा को रजिस्टर करते समय इसका उपयोग करें।',
    Locate: 'खोजें', 'Locating…': 'खोजा जा रहा है…', 'Pipeline completed.': 'पाइपलाइन पूरी हुई।',
    'Pipeline failed — check backend logs.': 'पाइपलाइन विफल — बैकएंड लॉग देखें।', 'Recalculation failed.': 'रीकैलकुलेशन विफल हुआ।',
    'Read-only access — pipeline and recalculation actions are restricted to admins.': 'रीड-ओनली एक्सेस — पाइपलाइन और रीकैलकुलेशन केवल एडमिन कर सकते हैं।',
    'NLP Monitor': 'NLP मॉनिटर', 'Run news pipeline now': 'न्यूज़ पाइपलाइन अभी चलाएं',
    'Risk scoring': 'रिस्क स्कोरिंग', 'Recalculate risk scores': 'रिस्क स्कोर दोबारा गणना करें',
    NEWS: 'न्यूज़', 'Loading headlines…': 'हेडलाइंस लोड हो रही हैं…', unavailable: 'उपलब्ध नहीं', calm: 'शांत',
    'Company HQ': 'कंपनी मुख्यालय', Notifications: 'नोटिफिकेशन', unread: 'अपठित',
    'Loading alerts…': 'अलर्ट्स लोड हो रहे हैं…', 'Mark as read': 'पढ़ा हुआ चिन्हित करें',
    'No alerts — risk levels look stable.': 'कोई अलर्ट नहीं — जोखिम स्तर स्थिर दिख रहे हैं।', Reviewed: 'समीक्षित',
    'No alerts — risk levels look stable for this company.': 'कोई अलर्ट नहीं — इस कंपनी के जोखिम स्तर स्थिर दिख रहे हैं।',
    'Profile Settings': 'प्रोफ़ाइल सेटिंग्स', 'Language & Region': 'भाषा और क्षेत्र',
    'Personal information': 'व्यक्तिगत जानकारी', Name: 'नाम', Email: 'ईमेल', Role: 'भूमिका', Company: 'कंपनी',
    'Edit your profile details.': 'अपनी प्रोफ़ाइल जानकारी संपादित करें।',
    'Email and role are managed by the account system.': 'ईमेल और भूमिका अकाउंट सिस्टम द्वारा प्रबंधित की जाती हैं।',
    'Save Profile': 'प्रोफ़ाइल सेव करें', 'Profile updated successfully.': 'प्रोफ़ाइल सफलतापूर्वक अपडेट हुई।',
    'Profile update failed.': 'प्रोफ़ाइल अपडेट विफल हुआ।', 'Choose the interface language for the entire SuplAI workspace.': 'पूरे SuplAI वर्कस्पेस की इंटरफेस भाषा चुनें।',
    Language: 'भाषा', 'Changes apply instantly across the interface.': 'बदलाव पूरे इंटरफेस पर तुरंत लागू होते हैं।',
    'English': 'अंग्रेज़ी', 'Hindi': 'हिन्दी', 'Spanish': 'स्पैनिश', 'French': 'फ़्रेंच', 'German': 'जर्मन',
    'Portuguese': 'पुर्तगाली', 'Japanese': 'जापानी', 'Chinese': 'चीनी', 'Arabic': 'अरबी',
    'United States': 'संयुक्त राज्य', India: 'भारत', Spain: 'स्पेन', France: 'फ़्रांस', Germany: 'जर्मनी',
    Brazil: 'ब्राज़ील', Japan: 'जापान', China: 'चीन', 'United Arab Emirates': 'संयुक्त अरब अमीरात',
    'Privacy Policy': 'गोपनीयता नीति', 'Demo-Synthetic Data': 'डेमो-सिंथेटिक डेटा',
  },
  es: {
    Dashboard: 'Panel', Suppliers: 'Proveedores', Network: 'Red', Alternatives: 'Alternativas',
    Disruptions: 'Interrupciones', Alerts: 'Alertas', Settings: 'Configuración',
    'Settings & Integration': 'Configuración e integración', 'Settings & Data': 'Configuración y datos',
    Login: 'Iniciar sesión', Logout: 'Cerrar sesión', 'Select company': 'Seleccionar empresa',
    'Open user menu': 'Abrir menú de usuario', 'Primary navigation': 'Navegación principal',
    Companies: 'Empresas', 'Supplier Explorer': 'Explorador de proveedores', 'Network & Simulation': 'Red y simulación',
    'Disruption Feed': 'Feed de interrupciones', 'How to use?': '¿Cómo usarlo?', 'Active Disruptions': 'Interrupciones activas',
    'Risky Suppliers': 'Proveedores de riesgo', 'Risk Score Trend': 'Tendencia de riesgo',
    'Overall supply-chain risk over time': 'Riesgo total de la cadena de suministro a lo largo del tiempo',
    Time: 'Tiempo', 'Risk Score': 'Puntuación de riesgo', 'View all disruptions': 'Ver todas las interrupciones',
    'View all suppliers': 'Ver todos los proveedores', 'Open disruption center': 'Abrir centro de interrupciones',
    'No active disruptions': 'No hay interrupciones activas', 'No risky suppliers found': 'No se encontraron proveedores de riesgo',
    'No feed items': 'No hay elementos en el feed', 'No risk trend data available': 'No hay datos de tendencia de riesgo',
    High: 'Alto', Medium: 'Medio', Low: 'Bajo', 'High Risk Suppliers': 'Proveedores de alto riesgo',
    'Medium Risk': 'Riesgo medio', 'Low Risk': 'Riesgo bajo', 'Total Suppliers': 'Proveedores totales',
    'Cost Index': 'Índice de coste', 'Lead Time': 'Tiempo de entrega', Country: 'País', Reset: 'Restablecer',
    'Search suppliers...': 'Buscar proveedores...', 'No suppliers match your filters.': 'Ningún proveedor coincide con tus filtros.',
    'Try widening the risk, cost, or lead-time limits.': 'Prueba a ampliar los límites de riesgo, coste o plazo de entrega.',
    'Search alternative suppliers...': 'Buscar proveedores alternativos...', 'Search alternative suppliers': 'Buscar proveedores alternativos',
    Rank: 'Rango', Supplier: 'Proveedor', Location: 'Ubicación', Risk: 'Riesgo', Composite: 'Compuesto',
    Global: 'Global', 'Unknown Supplier': 'Proveedor desconocido',
    'No alternative suppliers match your search.': 'Ningún proveedor alternativo coincide con tu búsqueda.',
    'No alternative suppliers for this company.': 'No hay proveedores alternativos para esta empresa.',
    SUPPLIERS: 'PROVEEDORES', 'Click a node to inspect it and toggle its disruption state.': 'Haz clic en un nodo para inspeccionarlo y cambiar su estado de interrupción.',
    'Run simulation': 'Ejecutar simulación', 'Run Simulation': 'Ejecutar simulación', 'Reset simulation': 'Restablecer simulación',
    'Select a supplier to simulate a disruption.': 'Selecciona un proveedor para simular una interrupción.',
    'Selected disruption nodes': 'Nodos de interrupción seleccionados', 'Network Risk': 'Riesgo de red',
    'Risk before': 'Riesgo anterior', 'Risk after': 'Riesgo posterior', 'Nodes affected': 'Nodos afectados',
    'Critical paths broken': 'Rutas críticas afectadas', 'Locate an address': 'Localizar una dirección',
    'Resolve any address to coordinates via the geocoding service — use this when registering a new supplier or facility.': 'Convierte cualquier dirección en coordenadas mediante el servicio de geocodificación.',
    Locate: 'Localizar', 'Locating…': 'Localizando…', 'Pipeline completed.': 'Proceso completado.',
    'Pipeline failed — check backend logs.': 'El proceso falló — revisa los registros del backend.', 'Recalculation failed.': 'El recálculo falló.',
    'Read-only access — pipeline and recalculation actions are restricted to admins.': 'Acceso de solo lectura — estas acciones están restringidas a los administradores.',
    'NLP Monitor': 'Monitor NLP', 'Run news pipeline now': 'Ejecutar canal de noticias ahora', 'Risk scoring': 'Puntuación de riesgo',
    'Recalculate risk scores': 'Recalcular puntuaciones de riesgo', NEWS: 'NOTICIAS', 'Loading headlines…': 'Cargando titulares…',
    unavailable: 'no disponible', calm: 'tranquilo', 'Company HQ': 'Sede de la empresa', Notifications: 'Notificaciones',
    unread: 'sin leer', 'Loading alerts…': 'Cargando alertas…', 'Mark as read': 'Marcar como leído',
    'No alerts — risk levels look stable.': 'No hay alertas — los niveles de riesgo parecen estables.', Reviewed: 'Revisado',
    'No alerts — risk levels look stable for this company.': 'No hay alertas — los niveles de riesgo de esta empresa parecen estables.',
    'Profile Settings': 'Configuración del perfil', 'Language & Region': 'Idioma y región',
    'Personal information': 'Información personal', Name: 'Nombre', Email: 'Correo electrónico', Role: 'Rol', Company: 'Empresa',
    'Edit your profile details.': 'Edita los datos de tu perfil.',
    'Email and role are managed by the account system.': 'El correo y el rol son gestionados por el sistema de cuentas.',
    'Save Profile': 'Guardar perfil', 'Profile updated successfully.': 'Perfil actualizado correctamente.',
    'Profile update failed.': 'No se pudo actualizar el perfil.', 'Choose the interface language for the entire SuplAI workspace.': 'Elige el idioma de la interfaz para todo el espacio de trabajo de SuplAI.',
    Language: 'Idioma', 'Changes apply instantly across the interface.': 'Los cambios se aplican al instante en toda la interfaz.',
    'English': 'Inglés', 'Hindi': 'Hindi', 'Spanish': 'Español', 'French': 'Francés', 'German': 'Alemán',
    'Portuguese': 'Portugués', 'Japanese': 'Japonés', 'Chinese': 'Chino', 'Arabic': 'Árabe',
    'United States': 'Estados Unidos', India: 'India', Spain: 'España', France: 'Francia', Germany: 'Alemania', Brazil: 'Brasil',
    Japan: 'Japón', China: 'China', 'United Arab Emirates': 'Emiratos Árabes Unidos',
    'Privacy Policy': 'Política de privacidad', 'Demo-Synthetic Data': 'Datos sintéticos de demo',
  },
  fr: {
    Dashboard: 'Tableau de bord', Suppliers: 'Fournisseurs', Network: 'Réseau', Alternatives: 'Alternatives',
    Disruptions: 'Perturbations', Alerts: 'Alertes', Settings: 'Paramètres',
    'Settings & Integration': 'Paramètres et intégration', 'Settings & Data': 'Paramètres et données',
    Login: 'Connexion', Logout: 'Déconnexion', 'Select company': 'Sélectionner une entreprise',
    'Open user menu': 'Ouvrir le menu utilisateur', 'Primary navigation': 'Navigation principale',
    Companies: 'Entreprises', 'Supplier Explorer': 'Explorateur de fournisseurs', 'Network & Simulation': 'Réseau et simulation',
    'Disruption Feed': 'Flux des perturbations', 'How to use?': 'Comment utiliser ?', 'Active Disruptions': 'Perturbations actives',
    'Risky Suppliers': 'Fournisseurs à risque', 'Risk Score Trend': 'Tendance du score de risque',
    'Overall supply-chain risk over time': 'Risque global de la chaîne logistique au fil du temps', Time: 'Temps',
    'Risk Score': 'Score de risque', 'View all disruptions': 'Voir toutes les perturbations', 'View all suppliers': 'Voir tous les fournisseurs',
    'Open disruption center': 'Ouvrir le centre des perturbations', 'No active disruptions': 'Aucune perturbation active',
    'No risky suppliers found': 'Aucun fournisseur à risque trouvé', 'No feed items': 'Aucun élément dans le flux',
    'No risk trend data available': 'Aucune donnée de tendance de risque disponible',
    High: 'Élevé', Medium: 'Moyen', Low: 'Faible', 'High Risk Suppliers': 'Fournisseurs à haut risque',
    'Medium Risk': 'Risque moyen', 'Low Risk': 'Risque faible', 'Total Suppliers': 'Total des fournisseurs',
    'Cost Index': 'Indice de coût', 'Lead Time': 'Délai', Country: 'Pays', Reset: 'Réinitialiser',
    'Search suppliers...': 'Rechercher des fournisseurs...', 'No suppliers match your filters.': 'Aucun fournisseur ne correspond à vos filtres.',
    'Try widening the risk, cost, or lead-time limits.': 'Essayez d’élargir les limites de risque, de coût ou de délai.',
    'Search alternative suppliers...': 'Rechercher des fournisseurs alternatifs...', 'Search alternative suppliers': 'Rechercher des fournisseurs alternatifs',
    Rank: 'Rang', Supplier: 'Fournisseur', Location: 'Emplacement', Risk: 'Risque', Composite: 'Composite', Global: 'Global',
    'Unknown Supplier': 'Fournisseur inconnu', 'No alternative suppliers match your search.': 'Aucun fournisseur alternatif ne correspond à votre recherche.',
    'No alternative suppliers for this company.': 'Aucun fournisseur alternatif pour cette entreprise.', SUPPLIERS: 'FOURNISSEURS',
    'Click a node to inspect it and toggle its disruption state.': 'Cliquez sur un nœud pour l’inspecter et modifier son état de perturbation.',
    'Run simulation': 'Lancer la simulation', 'Run Simulation': 'Lancer la simulation', 'Reset simulation': 'Réinitialiser la simulation',
    'Select a supplier to simulate a disruption.': 'Sélectionnez un fournisseur pour simuler une perturbation.',
    'Selected disruption nodes': 'Nœuds de perturbation sélectionnés', 'Network Risk': 'Risque du réseau', 'Risk before': 'Risque avant',
    'Risk after': 'Risque après', 'Nodes affected': 'Nœuds affectés', 'Critical paths broken': 'Chemins critiques rompus',
    'Locate an address': 'Localiser une adresse', Locate: 'Localiser', 'Locating…': 'Localisation…',
    'Pipeline completed.': 'Pipeline terminé.', 'Pipeline failed — check backend logs.': 'Échec du pipeline — vérifiez les journaux du backend.',
    'Recalculation failed.': 'Échec du recalcul.',
    'Read-only access — pipeline and recalculation actions are restricted to admins.': 'Accès en lecture seule — ces actions sont réservées aux administrateurs.',
    'NLP Monitor': 'Moniteur NLP', 'Run news pipeline now': 'Lancer le pipeline d’actualités', 'Risk scoring': 'Scoring du risque',
    'Recalculate risk scores': 'Recalculer les scores de risque', NEWS: 'ACTUALITÉS', 'Loading headlines…': 'Chargement des titres…',
    unavailable: 'indisponible', calm: 'calme', 'Company HQ': 'Siège de l’entreprise', Notifications: 'Notifications',
    unread: 'non lus', 'Loading alerts…': 'Chargement des alertes…', 'Mark as read': 'Marquer comme lu',
    'No alerts — risk levels look stable.': 'Aucune alerte — les niveaux de risque semblent stables.', Reviewed: 'Examiné',
    'No alerts — risk levels look stable for this company.': 'Aucune alerte — les niveaux de risque de cette entreprise semblent stables.',
    'Profile Settings': 'Paramètres du profil', 'Language & Region': 'Langue et région',
    'Personal information': 'Informations personnelles', Name: 'Nom', Email: 'E-mail', Role: 'Rôle', Company: 'Entreprise',
    'Edit your profile details.': 'Modifiez les informations de votre profil.',
    'Email and role are managed by the account system.': 'L’e-mail et le rôle sont gérés par le système de compte.',
    'Save Profile': 'Enregistrer le profil', 'Profile updated successfully.': 'Profil mis à jour avec succès.',
    'Profile update failed.': 'Échec de la mise à jour du profil.',
    'Choose the interface language for the entire SuplAI workspace.': 'Choisissez la langue de l’interface pour tout l’espace de travail SuplAI.',
    Language: 'Langue', 'Changes apply instantly across the interface.': 'Les changements s’appliquent instantanément à toute l’interface.',
    'English': 'Anglais', 'Hindi': 'Hindi', 'Spanish': 'Espagnol', 'French': 'Français', 'German': 'Allemand',
    'Portuguese': 'Portugais', 'Japanese': 'Japonais', 'Chinese': 'Chinois', 'Arabic': 'Arabe',
    'United States': 'États-Unis', India: 'Inde', Spain: 'Espagne', France: 'France', Germany: 'Allemagne', Brazil: 'Brésil',
    Japan: 'Japon', China: 'Chine', 'United Arab Emirates': 'Émirats arabes unis',
    'Privacy Policy': 'Politique de confidentialité', 'Demo-Synthetic Data': 'Données synthétiques de démonstration',
  },
  de: {
    Dashboard: 'Dashboard', Suppliers: 'Lieferanten', Network: 'Netzwerk', Alternatives: 'Alternativen',
    Disruptions: 'Störungen', Alerts: 'Warnungen', Settings: 'Einstellungen',
    'Settings & Integration': 'Einstellungen & Integration', 'Settings & Data': 'Einstellungen & Daten',
    Login: 'Anmelden', Logout: 'Abmelden', 'Select company': 'Unternehmen auswählen',
    'Open user menu': 'Benutzermenü öffnen', 'Primary navigation': 'Hauptnavigation', Companies: 'Unternehmen',
    'Supplier Explorer': 'Lieferanten-Explorer', 'Network & Simulation': 'Netzwerk & Simulation',
    'Disruption Feed': 'Störungsfeed', 'How to use?': 'Wie verwendet man es?', 'Active Disruptions': 'Aktive Störungen',
    'Risky Suppliers': 'Risikoreiche Lieferanten', 'Risk Score Trend': 'Risikowert-Trend',
    'Overall supply-chain risk over time': 'Gesamtes Lieferkettenrisiko im Zeitverlauf', Time: 'Zeit',
    'Risk Score': 'Risikoscore', 'View all disruptions': 'Alle Störungen anzeigen', 'View all suppliers': 'Alle Lieferanten anzeigen',
    'Open disruption center': 'Störungscenter öffnen', 'No active disruptions': 'Keine aktiven Störungen',
    'No risky suppliers found': 'Keine risikoreichen Lieferanten gefunden', 'No feed items': 'Keine Feed-Einträge',
    'No risk trend data available': 'Keine Risikotrenddaten verfügbar', High: 'Hoch', Medium: 'Mittel', Low: 'Niedrig',
    'High Risk Suppliers': 'Lieferanten mit hohem Risiko', 'Medium Risk': 'Mittleres Risiko', 'Low Risk': 'Niedriges Risiko',
    'Total Suppliers': 'Lieferanten gesamt', 'Cost Index': 'Kostenindex', 'Lead Time': 'Vorlaufzeit', Country: 'Land', Reset: 'Zurücksetzen',
    'Search suppliers...': 'Lieferanten suchen...', 'No suppliers match your filters.': 'Keine Lieferanten entsprechen Ihren Filtern.',
    'Try widening the risk, cost, or lead-time limits.': 'Erweitern Sie die Grenzen für Risiko, Kosten oder Vorlaufzeit.',
    'Search alternative suppliers...': 'Alternative Lieferanten suchen...', 'Search alternative suppliers': 'Alternative Lieferanten suchen',
    Rank: 'Rang', Supplier: 'Lieferant', Location: 'Standort', Risk: 'Risiko', Composite: 'Gesamtwert', Global: 'Global',
    'Unknown Supplier': 'Unbekannter Lieferant', 'No alternative suppliers match your search.': 'Keine alternativen Lieferanten entsprechen Ihrer Suche.',
    'No alternative suppliers for this company.': 'Keine alternativen Lieferanten für dieses Unternehmen.', SUPPLIERS: 'LIEFERANTEN',
    'Click a node to inspect it and toggle its disruption state.': 'Klicken Sie auf einen Knoten, um ihn zu prüfen und seinen Störungsstatus umzuschalten.',
    'Run simulation': 'Simulation starten', 'Run Simulation': 'Simulation starten', 'Reset simulation': 'Simulation zurücksetzen',
    'Select a supplier to simulate a disruption.': 'Wählen Sie einen Lieferanten, um eine Störung zu simulieren.',
    'Selected disruption nodes': 'Ausgewählte Störungsknoten', 'Network Risk': 'Netzwerkrisiko', 'Risk before': 'Risiko vorher', 'Risk after': 'Risiko nachher',
    'Nodes affected': 'Betroffene Knoten', 'Critical paths broken': 'Unterbrochene kritische Pfade', 'Locate an address': 'Adresse lokalisieren',
    Locate: 'Lokalisieren', 'Locating…': 'Wird lokalisiert…', 'Pipeline completed.': 'Pipeline abgeschlossen.',
    'Pipeline failed — check backend logs.': 'Pipeline fehlgeschlagen — Backend-Protokolle prüfen.', 'Recalculation failed.': 'Neuberechnung fehlgeschlagen.',
    'Read-only access — pipeline and recalculation actions are restricted to admins.': 'Nur-Lese-Zugriff — Pipeline und Neuberechnung sind auf Administratoren beschränkt.',
    'NLP Monitor': 'NLP-Monitor', 'Run news pipeline now': 'Nachrichten-Pipeline starten', 'Risk scoring': 'Risikobewertung',
    'Recalculate risk scores': 'Risikoscores neu berechnen', NEWS: 'NACHRICHTEN', 'Loading headlines…': 'Schlagzeilen werden geladen…',
    unavailable: 'nicht verfügbar', calm: 'ruhig', 'Company HQ': 'Unternehmenszentrale', Notifications: 'Benachrichtigungen',
    unread: 'ungelesen', 'Loading alerts…': 'Warnungen werden geladen…', 'Mark as read': 'Als gelesen markieren',
    'No alerts — risk levels look stable.': 'Keine Warnungen — die Risikowerte wirken stabil.', Reviewed: 'Geprüft',
    'No alerts — risk levels look stable for this company.': 'Keine Warnungen — die Risikowerte dieses Unternehmens wirken stabil.',
    'Profile Settings': 'Profileinstellungen', 'Language & Region': 'Sprache & Region', 'Personal information': 'Persönliche Informationen',
    Name: 'Name', Email: 'E-Mail', Role: 'Rolle', Company: 'Unternehmen', 'Edit your profile details.': 'Profildaten bearbeiten.',
    'Email and role are managed by the account system.': 'E-Mail und Rolle werden vom Kontosystem verwaltet.', 'Save Profile': 'Profil speichern',
    'Profile updated successfully.': 'Profil erfolgreich aktualisiert.', 'Profile update failed.': 'Profil konnte nicht aktualisiert werden.',
    'Choose the interface language for the entire SuplAI workspace.': 'Wählen Sie die Sprache der Oberfläche für den gesamten SuplAI-Arbeitsbereich.',
    Language: 'Sprache', 'Changes apply instantly across the interface.': 'Änderungen werden sofort auf die gesamte Oberfläche angewendet.',
    'English': 'Englisch', 'Hindi': 'Hindi', 'Spanish': 'Spanisch', 'French': 'Französisch', 'German': 'Deutsch',
    'Portuguese': 'Portugiesisch', 'Japanese': 'Japanisch', 'Chinese': 'Chinesisch', 'Arabic': 'Arabisch',
    'United States': 'Vereinigte Staaten', India: 'Indien', Spain: 'Spanien', France: 'Frankreich', Germany: 'Deutschland', Brazil: 'Brasilien',
    Japan: 'Japan', China: 'China', 'United Arab Emirates': 'Vereinigte Arabische Emirate',
    'Privacy Policy': 'Datenschutzrichtlinie', 'Demo-Synthetic Data': 'Demo-Synthetische Daten',
  },
  pt: {
    Dashboard: 'Painel', Suppliers: 'Fornecedores', Network: 'Rede', Alternatives: 'Alternativas', Disruptions: 'Interrupções',
    Alerts: 'Alertas', Settings: 'Configurações', 'Settings & Integration': 'Configurações e integração', 'Settings & Data': 'Configurações e dados',
    Login: 'Entrar', Logout: 'Sair', 'Select company': 'Selecionar empresa', 'Open user menu': 'Abrir menu do usuário',
    'Primary navigation': 'Navegação principal', Companies: 'Empresas', 'Supplier Explorer': 'Explorador de fornecedores',
    'Network & Simulation': 'Rede e simulação', 'Disruption Feed': 'Feed de interrupções', 'How to use?': 'Como usar?',
    'Active Disruptions': 'Interrupções ativas', 'Risky Suppliers': 'Fornecedores de risco', 'Risk Score Trend': 'Tendência do risco',
    'Overall supply-chain risk over time': 'Risco geral da cadeia de suprimentos ao longo do tempo', Time: 'Tempo',
    'Risk Score': 'Pontuação de risco', 'View all disruptions': 'Ver todas as interrupções', 'View all suppliers': 'Ver todos os fornecedores',
    'Open disruption center': 'Abrir central de interrupções', 'No active disruptions': 'Nenhuma interrupção ativa',
    'No risky suppliers found': 'Nenhum fornecedor de risco encontrado', 'No feed items': 'Nenhum item no feed',
    'No risk trend data available': 'Nenhum dado de tendência de risco disponível', High: 'Alto', Medium: 'Médio', Low: 'Baixo',
    'High Risk Suppliers': 'Fornecedores de alto risco', 'Medium Risk': 'Risco médio', 'Low Risk': 'Risco baixo',
    'Total Suppliers': 'Total de fornecedores', 'Cost Index': 'Índice de custo', 'Lead Time': 'Prazo de entrega', Country: 'País', Reset: 'Redefinir',
    'Search suppliers...': 'Pesquisar fornecedores...', 'No suppliers match your filters.': 'Nenhum fornecedor corresponde aos filtros.',
    'Try widening the risk, cost, or lead-time limits.': 'Tente ampliar os limites de risco, custo ou prazo.',
    'Search alternative suppliers...': 'Pesquisar fornecedores alternativos...', 'Search alternative suppliers': 'Pesquisar fornecedores alternativos',
    Rank: 'Classificação', Supplier: 'Fornecedor', Location: 'Localização', Risk: 'Risco', Composite: 'Composto',
    Global: 'Global', 'Unknown Supplier': 'Fornecedor desconhecido', 'No alternative suppliers match your search.': 'Nenhum fornecedor alternativo corresponde à pesquisa.',
    'No alternative suppliers for this company.': 'Não há fornecedores alternativos para esta empresa.', SUPPLIERS: 'FORNECEDORES',
    'Click a node to inspect it and toggle its disruption state.': 'Clique em um nó para inspecioná-lo e alternar seu estado de interrupção.',
    'Run simulation': 'Executar simulação', 'Run Simulation': 'Executar simulação', 'Reset simulation': 'Redefinir simulação',
    'Select a supplier to simulate a disruption.': 'Selecione um fornecedor para simular uma interrupção.',
    'Selected disruption nodes': 'Nós de interrupção selecionados', 'Network Risk': 'Risco da rede', 'Risk before': 'Risco antes', 'Risk after': 'Risco depois',
    'Nodes affected': 'Nós afetados', 'Critical paths broken': 'Caminhos críticos interrompidos', 'Locate an address': 'Localizar endereço', Locate: 'Localizar',
    'Locating…': 'Localizando…', 'Pipeline completed.': 'Pipeline concluído.', 'Pipeline failed — check backend logs.': 'Falha no pipeline — verifique os logs do backend.',
    'Recalculation failed.': 'Falha no recálculo.', 'Read-only access — pipeline and recalculation actions are restricted to admins.': 'Acesso somente leitura — pipeline e recálculo são restritos aos administradores.',
    'NLP Monitor': 'Monitor NLP', 'Run news pipeline now': 'Executar pipeline de notícias agora', 'Risk scoring': 'Pontuação de risco',
    'Recalculate risk scores': 'Recalcular pontuações de risco', NEWS: 'NOTÍCIAS', 'Loading headlines…': 'Carregando manchetes…', unavailable: 'indisponível',
    calm: 'calmo', 'Company HQ': 'Sede da empresa', Notifications: 'Notificações', unread: 'não lidas', 'Loading alerts…': 'Carregando alertas…',
    'Mark as read': 'Marcar como lido', 'No alerts — risk levels look stable.': 'Nenhum alerta — os níveis de risco parecem estáveis.', Reviewed: 'Revisado',
    'No alerts — risk levels look stable for this company.': 'Nenhum alerta — os níveis de risco desta empresa parecem estáveis.',
    'Profile Settings': 'Configurações do perfil', 'Language & Region': 'Idioma e região', 'Personal information': 'Informações pessoais',
    Name: 'Nome', Email: 'E-mail', Role: 'Função', Company: 'Empresa', 'Edit your profile details.': 'Edite os dados do seu perfil.',
    'Email and role are managed by the account system.': 'E-mail e função são gerenciados pelo sistema da conta.', 'Save Profile': 'Salvar perfil',
    'Profile updated successfully.': 'Perfil atualizado com sucesso.', 'Profile update failed.': 'Falha ao atualizar o perfil.',
    'Choose the interface language for the entire SuplAI workspace.': 'Escolha o idioma da interface para todo o espaço de trabalho SuplAI.', Language: 'Idioma',
    'Changes apply instantly across the interface.': 'As alterações são aplicadas instantaneamente em toda a interface.',
    'English': 'Inglês', 'Hindi': 'Hindi', 'Spanish': 'Espanhol', 'French': 'Francês', 'German': 'Alemão',
    'Portuguese': 'Português', 'Japanese': 'Japonês', 'Chinese': 'Chinês', 'Arabic': 'Árabe',
    'United States': 'Estados Unidos', India: 'Índia', Spain: 'Espanha', France: 'França', Germany: 'Alemanha', Brazil: 'Brasil',
    Japan: 'Japão', China: 'China', 'United Arab Emirates': 'Emirados Árabes Unidos',
    'Privacy Policy': 'Política de privacidade', 'Demo-Synthetic Data': 'Dados sintéticos de demonstração',
  },
  ja: {
    Dashboard: 'ダッシュボード', Suppliers: 'サプライヤー', Network: 'ネットワーク', Alternatives: '代替案', Disruptions: '混乱',
    Alerts: 'アラート', Settings: '設定', 'Settings & Integration': '設定と連携', 'Settings & Data': '設定とデータ',
    Login: 'ログイン', Logout: 'ログアウト', 'Select company': '会社を選択', 'Open user menu': 'ユーザーメニューを開く',
    'Primary navigation': 'メインナビゲーション', Companies: '企業', 'Supplier Explorer': 'サプライヤー探索',
    'Network & Simulation': 'ネットワークとシミュレーション', 'Disruption Feed': '混乱フィード', 'How to use?': '使い方',
    'Active Disruptions': 'アクティブな混乱', 'Risky Suppliers': '高リスクサプライヤー', 'Risk Score Trend': 'リスクスコア推移',
    'Overall supply-chain risk over time': '時間経過によるサプライチェーン全体のリスク', Time: '時間',
    'Risk Score': 'リスクスコア', 'View all disruptions': 'すべての混乱を見る', 'View all suppliers': 'すべてのサプライヤーを見る',
    'Open disruption center': '混乱センターを開く', 'No active disruptions': 'アクティブな混乱はありません',
    'No risky suppliers found': '高リスクのサプライヤーはありません', 'No feed items': 'フィード項目はありません',
    'No risk trend data available': 'リスク推移データはありません', High: '高', Medium: '中', Low: '低',
    'High Risk Suppliers': '高リスクサプライヤー', 'Medium Risk': '中リスク', 'Low Risk': '低リスク',
    'Total Suppliers': 'サプライヤー合計', 'Cost Index': 'コスト指数', 'Lead Time': 'リードタイム', Country: '国', Reset: 'リセット',
    'Search suppliers...': 'サプライヤーを検索…', 'No suppliers match your filters.': '条件に一致するサプライヤーがありません。',
    'Try widening the risk, cost, or lead-time limits.': 'リスク、コスト、リードタイムの条件を広げてください。',
    'Search alternative suppliers...': '代替サプライヤーを検索…', 'Search alternative suppliers': '代替サプライヤーを検索',
    Rank: '順位', Supplier: 'サプライヤー', Location: '場所', Risk: 'リスク', Composite: '総合値', Global: 'グローバル',
    'Unknown Supplier': '不明なサプライヤー', 'No alternative suppliers match your search.': '検索に一致する代替サプライヤーがありません。',
    'No alternative suppliers for this company.': 'この会社に代替サプライヤーはありません。', SUPPLIERS: 'サプライヤー',
    'Click a node to inspect it and toggle its disruption state.': 'ノードをクリックして詳細を確認し、混乱状態を切り替えます。',
    'Run simulation': 'シミュレーション実行', 'Run Simulation': 'シミュレーション実行', 'Reset simulation': 'シミュレーションをリセット',
    'Select a supplier to simulate a disruption.': '混乱をシミュレーションするサプライヤーを選択してください。',
    'Selected disruption nodes': '選択中の混乱ノード', 'Network Risk': 'ネットワークリスク', 'Risk before': '変更前リスク', 'Risk after': '変更後リスク',
    'Nodes affected': '影響ノード数', 'Critical paths broken': '分断された重要経路', 'Locate an address': '住所を検索', Locate: '検索', 'Locating…': '検索中…',
    'Pipeline completed.': 'パイプラインが完了しました。', 'Pipeline failed — check backend logs.': 'パイプラインに失敗しました — バックエンドログを確認してください。',
    'Recalculation failed.': '再計算に失敗しました。', 'Read-only access — pipeline and recalculation actions are restricted to admins.': '読み取り専用アクセス — パイプラインと再計算は管理者のみ実行できます。',
    'NLP Monitor': 'NLPモニター', 'Run news pipeline now': 'ニュースパイプラインを実行', 'Risk scoring': 'リスクスコアリング',
    'Recalculate risk scores': 'リスクスコアを再計算', NEWS: 'ニュース', 'Loading headlines…': '見出しを読み込み中…', unavailable: '利用不可', calm: '穏やか',
    'Company HQ': '会社本社', Notifications: '通知', unread: '未読', 'Loading alerts…': 'アラートを読み込み中…', 'Mark as read': '既読にする',
    'No alerts — risk levels look stable.': 'アラートはありません — リスクレベルは安定しています。', Reviewed: '確認済み',
    'No alerts — risk levels look stable for this company.': 'アラートはありません — この会社のリスクレベルは安定しています。',
    'Profile Settings': 'プロフィール設定', 'Language & Region': '言語と地域', 'Personal information': '個人情報',
    Name: '名前', Email: 'メール', Role: '役割', Company: '会社', 'Edit your profile details.': 'プロフィール情報を編集します。',
    'Email and role are managed by the account system.': 'メールと役割はアカウントシステムで管理されます。', 'Save Profile': 'プロフィールを保存',
    'Profile updated successfully.': 'プロフィールを更新しました。', 'Profile update failed.': 'プロフィールの更新に失敗しました。',
    'Choose the interface language for the entire SuplAI workspace.': 'SuplAIワークスペース全体の表示言語を選択してください。',
    Language: '言語', 'Changes apply instantly across the interface.': '変更はインターフェース全体に即時適用されます。',
    'English': '英語', 'Hindi': 'ヒンディー語', 'Spanish': 'スペイン語', 'French': 'フランス語', 'German': 'ドイツ語',
    'Portuguese': 'ポルトガル語', 'Japanese': '日本語', 'Chinese': '中国語', 'Arabic': 'アラビア語',
    'United States': 'アメリカ合衆国', India: 'インド', Spain: 'スペイン', France: 'フランス', Germany: 'ドイツ', Brazil: 'ブラジル',
    Japan: '日本', China: '中国', 'United Arab Emirates': 'アラブ首長国連邦',
    'Privacy Policy': 'プライバシーポリシー', 'Demo-Synthetic Data': 'デモ用合成データ',
  },
  zh: {
    Dashboard: '仪表板', Suppliers: '供应商', Network: '网络', Alternatives: '替代方案', Disruptions: '中断', Alerts: '警报', Settings: '设置',
    'Settings & Integration': '设置与集成', 'Settings & Data': '设置与数据', Login: '登录', Logout: '退出登录',
    'Select company': '选择公司', 'Open user menu': '打开用户菜单', 'Primary navigation': '主导航', Companies: '公司',
    'Supplier Explorer': '供应商探索', 'Network & Simulation': '网络与模拟', 'Disruption Feed': '中断动态', 'How to use?': '如何使用？',
    'Active Disruptions': '活跃中断', 'Risky Suppliers': '高风险供应商', 'Risk Score Trend': '风险评分趋势',
    'Overall supply-chain risk over time': '供应链总体风险随时间变化', Time: '时间', 'Risk Score': '风险评分',
    'View all disruptions': '查看所有中断', 'View all suppliers': '查看所有供应商', 'Open disruption center': '打开中断中心',
    'No active disruptions': '没有活跃中断', 'No risky suppliers found': '未发现高风险供应商', 'No feed items': '没有动态内容',
    'No risk trend data available': '没有可用的风险趋势数据', High: '高', Medium: '中', Low: '低',
    'High Risk Suppliers': '高风险供应商', 'Medium Risk': '中风险', 'Low Risk': '低风险', 'Total Suppliers': '供应商总数',
    'Cost Index': '成本指数', 'Lead Time': '交付周期', Country: '国家', Reset: '重置', 'Search suppliers...': '搜索供应商...',
    'No suppliers match your filters.': '没有供应商符合筛选条件。', 'Try widening the risk, cost, or lead-time limits.': '尝试扩大风险、成本或交付周期范围。',
    'Search alternative suppliers...': '搜索替代供应商...', 'Search alternative suppliers': '搜索替代供应商', Rank: '排名', Supplier: '供应商',
    Location: '位置', Risk: '风险', Composite: '综合值', Global: '全球', 'Unknown Supplier': '未知供应商',
    'No alternative suppliers match your search.': '没有替代供应商符合搜索条件。', 'No alternative suppliers for this company.': '该公司没有替代供应商。',
    SUPPLIERS: '供应商', 'Click a node to inspect it and toggle its disruption state.': '点击节点查看详情并切换其中断状态。',
    'Run simulation': '运行模拟', 'Run Simulation': '运行模拟', 'Reset simulation': '重置模拟', 'Select a supplier to simulate a disruption.': '选择供应商以模拟中断。',
    'Selected disruption nodes': '已选中断节点', 'Network Risk': '网络风险', 'Risk before': '之前风险', 'Risk after': '之后风险',
    'Nodes affected': '受影响节点', 'Critical paths broken': '中断的关键路径', 'Locate an address': '定位地址', Locate: '定位', 'Locating…': '正在定位…',
    'Pipeline completed.': '流水线已完成。', 'Pipeline failed — check backend logs.': '流水线失败 — 请检查后端日志。', 'Recalculation failed.': '重新计算失败。',
    'Read-only access — pipeline and recalculation actions are restricted to admins.': '只读访问 — 流水线和重新计算仅限管理员。',
    'NLP Monitor': 'NLP 监控', 'Run news pipeline now': '立即运行新闻流水线', 'Risk scoring': '风险评分', 'Recalculate risk scores': '重新计算风险评分',
    NEWS: '新闻', 'Loading headlines…': '正在加载头条…', unavailable: '不可用', calm: '平稳', 'Company HQ': '公司总部',
    Notifications: '通知', unread: '未读', 'Loading alerts…': '正在加载警报…', 'Mark as read': '标记为已读',
    'No alerts — risk levels look stable.': '没有警报 — 风险水平看起来稳定。', Reviewed: '已查看',
    'No alerts — risk levels look stable for this company.': '没有警报 — 该公司的风险水平看起来稳定。',
    'Profile Settings': '个人资料设置', 'Language & Region': '语言和地区', 'Personal information': '个人信息', Name: '姓名', Email: '邮箱', Role: '角色', Company: '公司',
    'Edit your profile details.': '编辑个人资料信息。', 'Email and role are managed by the account system.': '邮箱和角色由账户系统管理。',
    'Save Profile': '保存资料', 'Profile updated successfully.': '个人资料更新成功。', 'Profile update failed.': '个人资料更新失败。',
    'Choose the interface language for the entire SuplAI workspace.': '选择整个 SuplAI 工作区的界面语言。', Language: '语言',
    'Changes apply instantly across the interface.': '更改会立即应用到整个界面。',
    'English': '英语', 'Hindi': '印地语', 'Spanish': '西班牙语', 'French': '法语', 'German': '德语', 'Portuguese': '葡萄牙语',
    'Japanese': '日语', 'Chinese': '中文', 'Arabic': '阿拉伯语', 'United States': '美国', India: '印度', Spain: '西班牙', France: '法国',
    Germany: '德国', Brazil: '巴西', Japan: '日本', China: '中国', 'United Arab Emirates': '阿拉伯联合酋长国',
    'Privacy Policy': '隐私政策', 'Demo-Synthetic Data': '演示合成数据',
  },
  ar: {
    Dashboard: 'لوحة التحكم', Suppliers: 'الموردون', Network: 'الشبكة', Alternatives: 'البدائل', Disruptions: 'الاضطرابات',
    Alerts: 'التنبيهات', Settings: 'الإعدادات', 'Settings & Integration': 'الإعدادات والتكامل', 'Settings & Data': 'الإعدادات والبيانات',
    Login: 'تسجيل الدخول', Logout: 'تسجيل الخروج', 'Select company': 'اختر الشركة', 'Open user menu': 'فتح قائمة المستخدم',
    'Primary navigation': 'التنقل الرئيسي', Companies: 'الشركات', 'Supplier Explorer': 'مستكشف الموردين', 'Network & Simulation': 'الشبكة والمحاكاة',
    'Disruption Feed': 'موجز الاضطرابات', 'How to use?': 'كيف تستخدمه؟', 'Active Disruptions': 'الاضطرابات النشطة',
    'Risky Suppliers': 'الموردون ذوو المخاطر', 'Risk Score Trend': 'اتجاه درجة المخاطر',
    'Overall supply-chain risk over time': 'مخاطر سلسلة التوريد الإجمالية بمرور الوقت', Time: 'الوقت', 'Risk Score': 'درجة المخاطر',
    'View all disruptions': 'عرض جميع الاضطرابات', 'View all suppliers': 'عرض جميع الموردين', 'Open disruption center': 'فتح مركز الاضطرابات',
    'No active disruptions': 'لا توجد اضطرابات نشطة', 'No risky suppliers found': 'لم يتم العثور على موردين مرتفعي المخاطر',
    'No feed items': 'لا توجد عناصر في الموجز', 'No risk trend data available': 'لا تتوفر بيانات لاتجاه المخاطر',
    High: 'مرتفع', Medium: 'متوسط', Low: 'منخفض', 'High Risk Suppliers': 'موردون مرتفعو المخاطر', 'Medium Risk': 'مخاطر متوسطة',
    'Low Risk': 'مخاطر منخفضة', 'Total Suppliers': 'إجمالي الموردين', 'Cost Index': 'مؤشر التكلفة', 'Lead Time': 'مدة التوريد',
    Country: 'الدولة', Reset: 'إعادة تعيين', 'Search suppliers...': 'ابحث عن الموردين...',
    'No suppliers match your filters.': 'لا يوجد موردون يطابقون الفلاتر.', 'Try widening the risk, cost, or lead-time limits.': 'جرّب توسيع حدود المخاطر أو التكلفة أو مدة التوريد.',
    'Search alternative suppliers...': 'ابحث عن موردين بدلاء...', 'Search alternative suppliers': 'ابحث عن موردين بدلاء', Rank: 'الترتيب', Supplier: 'المورد',
    Location: 'الموقع', Risk: 'المخاطر', Composite: 'المؤشر المركب', Global: 'عالمي', 'Unknown Supplier': 'مورد غير معروف',
    'No alternative suppliers match your search.': 'لا يوجد موردون بدلاء يطابقون بحثك.', 'No alternative suppliers for this company.': 'لا يوجد موردون بدلاء لهذه الشركة.',
    SUPPLIERS: 'الموردون', 'Click a node to inspect it and toggle its disruption state.': 'اضغط على عقدة لفحصها وتبديل حالة اضطرابها.',
    'Run simulation': 'تشغيل المحاكاة', 'Run Simulation': 'تشغيل المحاكاة', 'Reset simulation': 'إعادة ضبط المحاكاة',
    'Select a supplier to simulate a disruption.': 'اختر مورداً لمحاكاة اضطراب.', 'Selected disruption nodes': 'عقد الاضطراب المحددة',
    'Network Risk': 'مخاطر الشبكة', 'Risk before': 'المخاطر قبل', 'Risk after': 'المخاطر بعد', 'Nodes affected': 'العقد المتأثرة',
    'Critical paths broken': 'المسارات الحرجة المتأثرة', 'Locate an address': 'تحديد موقع عنوان', Locate: 'تحديد', 'Locating…': 'جارٍ التحديد…',
    'Pipeline completed.': 'اكتملت المعالجة.', 'Pipeline failed — check backend logs.': 'فشلت المعالجة — تحقّق من سجلات الخادم.', 'Recalculation failed.': 'فشلت إعادة الحساب.',
    'Read-only access — pipeline and recalculation actions are restricted to admins.': 'صلاحية قراءة فقط — المعالجة وإعادة الحساب متاحة للمشرفين فقط.',
    'NLP Monitor': 'مراقب NLP', 'Run news pipeline now': 'تشغيل معالجة الأخبار الآن', 'Risk scoring': 'تقييم المخاطر', 'Recalculate risk scores': 'إعادة حساب درجات المخاطر',
    NEWS: 'الأخبار', 'Loading headlines…': 'جارٍ تحميل العناوين…', unavailable: 'غير متاح', calm: 'هادئ', 'Company HQ': 'مقر الشركة',
    Notifications: 'الإشعارات', unread: 'غير مقروء', 'Loading alerts…': 'جارٍ تحميل التنبيهات…', 'Mark as read': 'تحديد كمقروء',
    'No alerts — risk levels look stable.': 'لا توجد تنبيهات — مستويات المخاطر تبدو مستقرة.', Reviewed: 'تمت المراجعة',
    'No alerts — risk levels look stable for this company.': 'لا توجد تنبيهات — مستويات المخاطر لهذه الشركة تبدو مستقرة.',
    'Profile Settings': 'إعدادات الملف الشخصي', 'Language & Region': 'اللغة والمنطقة', 'Personal information': 'المعلومات الشخصية',
    Name: 'الاسم', Email: 'البريد الإلكتروني', Role: 'الدور', Company: 'الشركة', 'Edit your profile details.': 'عدّل معلومات ملفك الشخصي.',
    'Email and role are managed by the account system.': 'يدير نظام الحساب البريد الإلكتروني والدور.', 'Save Profile': 'حفظ الملف الشخصي',
    'Profile updated successfully.': 'تم تحديث الملف الشخصي بنجاح.', 'Profile update failed.': 'فشل تحديث الملف الشخصي.',
    'Choose the interface language for the entire SuplAI workspace.': 'اختر لغة الواجهة لمساحة عمل SuplAI بالكامل.', Language: 'اللغة',
    'Changes apply instantly across the interface.': 'تُطبّق التغييرات فوراً على الواجهة بالكامل.',
    'English': 'الإنجليزية', 'Hindi': 'الهندية', 'Spanish': 'الإسبانية', 'French': 'الفرنسية', 'German': 'الألمانية',
    'Portuguese': 'البرتغالية', 'Japanese': 'اليابانية', 'Chinese': 'الصينية', 'Arabic': 'العربية', 'United States': 'الولايات المتحدة',
    India: 'الهند', Spain: 'إسبانيا', France: 'فرنسا', Germany: 'ألمانيا', Brazil: 'البرازيل', Japan: 'اليابان', China: 'الصين',
    'United Arab Emirates': 'الإمارات العربية المتحدة', 'Privacy Policy': 'سياسة الخصوصية', 'Demo-Synthetic Data': 'بيانات تجريبية اصطناعية',
  },
};

const prefixTranslations = {
  hi: {
    'Run NLP monitor and refresh risk scores for ': 'NLP मॉनिटर चलाएं और इसके लिए रिस्क स्कोर रीफ्रेश करें: ',
    'Updated ': 'अपडेट किए गए ', ' suppliers. Overall risk: ': ' सप्लायर्स। कुल जोखिम: ', 'Risk ': 'रिस्क ',
  },
  es: {
    'Run NLP monitor and refresh risk scores for ': 'Ejecuta el monitor NLP y actualiza las puntuaciones de riesgo para ',
    'Updated ': 'Actualizados ', ' suppliers. Overall risk: ': ' proveedores. Riesgo total: ', 'Risk ': 'Riesgo ',
  },
  fr: {
    'Run NLP monitor and refresh risk scores for ': 'Exécuter le moniteur NLP et actualiser les scores de risque pour ',
    'Updated ': 'Mis à jour : ', ' suppliers. Overall risk: ': ' fournisseurs. Risque global : ', 'Risk ': 'Risque ',
  },
  de: {
    'Run NLP monitor and refresh risk scores for ': 'NLP-Monitor ausführen und Risikoscores aktualisieren für ',
    'Updated ': 'Aktualisiert: ', ' suppliers. Overall risk: ': ' Lieferanten. Gesamtrisiko: ', 'Risk ': 'Risiko ',
  },
  pt: {
    'Run NLP monitor and refresh risk scores for ': 'Executar o monitor NLP e atualizar os riscos para ',
    'Updated ': 'Atualizados ', ' suppliers. Overall risk: ': ' fornecedores. Risco geral: ', 'Risk ': 'Risco ',
  },
  ja: {
    'Run NLP monitor and refresh risk scores for ': 'NLPモニターを実行してリスクスコアを更新: ',
    'Updated ': '更新済み ', ' suppliers. Overall risk: ': ' 件のサプライヤー。全体リスク: ', 'Risk ': 'リスク ',
  },
  zh: {
    'Run NLP monitor and refresh risk scores for ': '运行NLP监控并刷新风险评分：',
    'Updated ': '已更新 ', ' suppliers. Overall risk: ': ' 个供应商。总体风险：', 'Risk ': '风险 ',
  },
  ar: {
    'Run NLP monitor and refresh risk scores for ': 'شغّل مراقب NLP وحدّث درجات المخاطر لـ ',
    'Updated ': 'تم تحديث ', ' suppliers. Overall risk: ': ' موردين. إجمالي المخاطر: ', 'Risk ': 'المخاطر ',
  },
};

const translateDynamicText = (text, lang) => {
  const prefixMap = prefixTranslations[lang];
  if (prefixMap) {
    for (const prefix of Object.keys(prefixMap)) {
      if (text.startsWith(prefix)) {
        return prefixMap[prefix] + text.slice(prefix.length);
      }
    }
  }

  const match = text.match(/^(\d+)\\s+(High Risk Suppliers|Medium Risk|Low Risk|Total Suppliers|suppliers?|days)$/i);
  if (!match) return text;

  const count = match[1];
  const label = match[2].toLowerCase();
  const dict = COMMON[lang] || {};

  if (label === 'high risk suppliers') return count + ' ' + (dict['High Risk Suppliers'] || 'High Risk Suppliers');
  if (label === 'medium risk') return count + ' ' + (dict['Medium Risk'] || 'Medium Risk');
  if (label === 'low risk') return count + ' ' + (dict['Low Risk'] || 'Low Risk');
  if (label === 'total suppliers') return count + ' ' + (dict['Total Suppliers'] || 'Total Suppliers');
  if (label.includes('supplier')) return count + ' ' + (dict.suppliers || dict.Supplier || 'suppliers');

  const days = { hi: 'दिन', es: 'días', fr: 'jours', de: 'Tage', pt: 'dias', ja: '日', zh: '天', ar: 'يوم' };
  return count + ' ' + (days[lang] || 'days');
};

const shouldTranslate = (node) => {
  const element = node.parentElement;
  if (!element) return false;
  if (element.closest('script,style,noscript,svg')) return false;

  const blocked = element.closest(
    '.news-title, .news-meta, .supplier-card-name, .alternative-supplier-info strong, .network-supplier-item-name, .alert-title, .alert-message, .disruption-feed-title, .disruption-feed-location, .disruption-feed-industry, .alternative-location, .leaflet-container',
  );

  return !blocked;
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const getInitialLanguage = () => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return LANGUAGES.some((item) => item.code === stored) ? stored : 'en';
    } catch {
      return 'en';
    }
  };

  const [language, setLanguageState] = useState(getInitialLanguage);
  const textOriginals = useRef(new WeakMap());
  const attributeOriginals = useRef(new WeakMap());
  const applying = useRef(false);

  const translate = useCallback(
    (value) => {
      if (!value || language === 'en') return value;

      const dictionary = COMMON[language] || {};
      const trimmed = value.trim();
      const leading = (value.match(/^\\s*/) || [''])[0];
      const trailing = (value.match(/\\s*$/) || [''])[0];

      if (dictionary[trimmed]) {
        return leading + dictionary[trimmed] + trailing;
      }

      const dynamic = translateDynamicText(trimmed, language);
      return dynamic !== trimmed ? leading + dynamic + trailing : value;
    },
    [language],
  );

  const applyLanguage = useCallback(() => {
    if (typeof document === 'undefined' || applying.current) return;

    applying.current = true;
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        if (node.nodeValue?.trim() && shouldTranslate(node)) {
          if (!textOriginals.current.has(node)) {
            textOriginals.current.set(node, node.nodeValue);
          }
          const original = textOriginals.current.get(node);
          const translated = translate(original);
          if (node.nodeValue !== translated) node.nodeValue = translated;
        }
        node = walker.nextNode();
      }

      const attrs = ['placeholder', 'aria-label', 'title'];
      const elements = document.body.querySelectorAll('input, textarea, button, [aria-label], [title]');

      elements.forEach((element) => {
        if (element.closest('script,style')) return;

        const store = attributeOriginals.current.get(element) || {};

        for (const attr of attrs) {
          if (!element.hasAttribute(attr)) continue;
          if (!store[attr]) store[attr] = element.getAttribute(attr);

          const original = store[attr];
          const translated = translate(original);
          if (element.getAttribute(attr) !== translated) {
            element.setAttribute(attr, translated);
          }
        }

        attributeOriginals.current.set(element, store);
      });
    } finally {
      applying.current = false;
    }
  }, [translate]);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {}

    const locale = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];
    document.documentElement.lang = locale.locale;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.dataset.suplaiLanguage = language;

    applyLanguage();

    const observer = new MutationObserver(() => applyLanguage());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [language, applyLanguage]);

  const setLanguage = (nextLanguage) => {
    if (LANGUAGES.some((item) => item.code === nextLanguage)) setLanguageState(nextLanguage);
  };

  const value = useMemo(
    () => ({ language, setLanguage, languages: LANGUAGES, translate }),
    [language, translate],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
