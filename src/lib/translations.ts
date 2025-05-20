import { appSettings } from './settings';
import { derived, get } from 'svelte/store';

type Locale = 'en' | 'pt';

type Translations = {
  [key: string]: {
    [locale in Locale]?: string;
  };
};

export function getLocale() {
	const settings = get(appSettings);
	const locale = settings.locale === 'system' ? navigator.language.split('-')[0] : settings.locale;
	return (['en', 'pt'].includes(locale) ? locale : 'en') as Locale;
}

export const t = derived(appSettings, () => {
	return (key: string, params: Record<string, string> = {}): string => {
		const locale = getLocale();
		const template = translations[key]?.[locale];

		if (!template) {
			console.warn(`Translation not found for key: ${key} in locale: ${locale}`);
			return translations[key]?.en ?? key; // Fallback to English if not found
		}

		return template.replace(/{{(.*?)}}/g, (_, param) => {
			return params[param.trim()] ?? '';
		});
	};
});

const translations: Translations = {
	ok_button: {
		en: 'Ok',
		pt: 'Ok',
	},
	ignore_button: {
		en: 'Ignore',
		pt: 'Ignorar',
	},
	new_version_available: {
		en: 'New version available!',
		pt: 'Nova versão disponível!',
	},
	see_release_notes: {
		en: 'See release notes',
		pt: 'Veja as novidades',
	},
	distance_traveled: {
		en: 'Distance Traveled',
		pt: 'Distância Percorrida',
	},
	average_speed: {
		en: 'Average Speed',
		pt: 'Velocidade Média',
	},
	distance_left: {
		en: 'Distance Left',
		pt: 'Distância em Falta',
	},
	time_left: {
		en: 'Time Left',
		pt: 'Tempo em Falta',
	},
	arrival_time: {
		en: 'Arrival Time',
		pt: 'Hora de Chegada',
	},
	rate_trip_error: {
		en: 'Error rating trip',
		pt: 'Erro ao avaliar viagem',
	},
	last_trip_question: {
		en: 'How was your last trip?',
		pt: 'Como foi a sua última viagem?',
	},
	station_label: {
		en: 'Station',
		pt: 'Estação',
	},
	bikes_label: {
		en: 'BIKES',
		pt: 'BICICLETAS',
	},
	free_docks_label: {
		en: 'FREE\nDOCKS',
		pt: 'DOCAS\nLIVRES',
	},
	duration_label: {
		en: 'DURATION',
		pt: 'DURAÇÃO',
	},
	hours_label: {
		en: 'h',
		pt: 'h',
	},
	minutes_label: {
		en: 'min',
		pt: 'min',
	},
	trips_label: {
		en: 'Trips',
		pt: 'Viagens',
	},
	no_trips_label: {
		en: 'No trips',
		pt: 'Nenhuma viagem',
	},
	no_trips_registered_label: {
		en: 'No trips registered',
		pt: 'Não há viagens registadas',
	},
	about_label: {
		en: 'About',
		pt: 'Sobre',
	},
	app_description: {
		en: 'This application is a re-implementation of the Gira app\'s functionalities.',
		pt: 'Esta aplicação é uma re-implementação das funcionalidades da aplicação Gira.',
	},
	not_official_disclaimer: {
		en: 'The application is unofficial and not affiliated in any way with EMEL or Câmara Municipal de Lisboa.',
		pt: 'A aplicação não é oficial, não estando afiliada de modo algum à EMEL ou à Câmara Municipal de Lisboa.',
	},
	find_out_more_at: {
		en: 'Find out more at ',
		pt: 'Saiba mais em ',
	},
	made_by: {
		en: 'Made by',
		pt: 'Desenvolvido por',
	},
	open_source_license: {
		en: 'Open-source project under the GPL-3.0 license',
		pt: 'Projeto open-source sob a licença GPL-3.0',
	},
	user_label: {
		en: 'User',
		pt: 'Utilizador',
	},
	balance_label: {
		en: 'Balance',
		pt: 'Saldo',
	},
	points_label: {
		en: 'Points',
		pt: 'Pontos',
	},
	no_subscription_label: {
		en: 'No subscription',
		pt: 'Sem subscrição',
	},
	annual_pass_label: {
		en: 'Annual Pass',
		pt: 'Passe Anual',
	},
	monthly_pass_label: {
		en: 'Monthly Pass',
		pt: 'Passe Mensal',
	},
	daily_pass_label: {
		en: 'Daily Pass',
		pt: 'Passe Diário',
	},
	valid_until_label: {
		en: 'Valid until {{date}}',
		pt: 'Válido até {{date}}',
	},
	history_label: {
		en: 'History',
		pt: 'Histórico',
	},
	settings_label: {
		en: 'Settings',
		pt: 'Configurações',
	},
	feedback_label: {
		en: 'Feedback',
		pt: 'Feedback',
	},
	contribute_label: {
		en: 'Contribute',
		pt: 'Contribuir',
	},
	exit_label: {
		en: 'EXIT',
		pt: 'SAIR',
	},
	welcome_message: {
		en: 'Welcome to Gira+',
		pt: 'Bem-vindo à Gira+',
	},
	email_label: {
		en: 'Email',
		pt: 'Email',
	},
	email_placeholder: {
		en: 'example@example.com',
		pt: 'exemplo@exemplo.com',
	},
	password_label: {
		en: 'Password',
		pt: 'Password',
	},
	invalid_credentials_error: {
		en: 'Invalid credentials',
		pt: 'Credenciais inválidas',
	},
	unknown_error: {
		en: 'Unknown error',
		pt: 'Erro desconhecido',
	},
	login_button: {
		en: 'Login',
		pt: 'Login',
	},
	login_disclaimer: {
		en: 'This application is not official and is not affiliated with EMEL. Your credentials are not shared with us or any third party.',
		pt: 'Esta aplicação não é oficial e não está afiliada à EMEL. As suas credenciais não são partilhadas connosco ou com terceiros.',
	},
	history_subtext: {
		en: 'List of previous trips',
		pt: 'Lista de viagens anteriores',
	},
	settings_subtext: {
		en: 'Application settings',
		pt: 'Definições da aplicação',
	},
	feedback_subtext: {
		en: 'Problems and suggestions',
		pt: 'Problemas e sugestões',
	},
	about_subtext: {
		en: 'Information about the application',
		pt: 'Informação acerca da aplicação',
	},
	contribute_subtext: {
		en: 'Support the project\'s development',
		pt: 'Apoiar o desenvolvimento do projeto',
	},
	dock_label: {
		en: 'DOCK',
		pt: 'DOCA',
	},
	theme_setting_label: {
		en: 'Theme',
		pt: 'Tema',
	},
	theme_setting_description: {
		en: 'Application color scheme',
		pt: 'Esquema de cores da aplicação',
	},
	system_theme: {
		en: 'System',
		pt: 'Sistema',
	},
	light_theme: {
		en: 'Light',
		pt: 'Claro',
	},
	dark_theme: {
		en: 'Dark',
		pt: 'Escuro',
	},
	locale_setting_label: {
		en: 'Language',
		pt: 'Idioma',
	},
	locale_setting_description: {
		en: 'Application language',
		pt: 'Idioma da aplicação',
	},
	system_locale: {
		en: 'System',
		pt: 'Sistema',
	},
	lock_distance_setting_label: {
		en: 'Limit unlocking',
		pt: 'Limitar desbloqueio',
	},
	lock_distance_setting_description: {
		en: 'Restrict bicycle unlocking distance to {{distance}} meters',
		pt: 'Restringir a distância de desbloqueio de bicicletas a {{distance}} metros',
	},
	background_location_setting_label: {
		en: 'Background location',
		pt: 'Localização em segundo plano',
	},
	background_location_setting_description: {
		en: 'Continue updating the location while the device is locked or the app is in the background',
		pt: 'Continuar a atualizar a localização enquanto o dispositivo está bloqueado ou a aplicação está em segundo plano',
	},
	analytics_setting_label: {
		en: 'Contribute to statistics',
		pt: 'Contribuir para estatísticas',
	},
	analytics_setting_description: {
		en: 'Contribute with the collection of anonymous events: app opening, trip starts and errors',
		pt: 'Contribuir com a coleção de eventos anónimos: abertura da aplicação, começo de viagens e erros',
	},
	mock_unlock_setting_label: {
		en: 'Simulate unlocking',
		pt: 'Simular desbloqueio',
	},
	mock_unlock_setting_description: {
		en: 'Simulate reservation and unlocking of bicycles in development mode',
		pt: 'Simular a reserva e desbloqueio de bicicletas em modo de desenvolvimento',
	},
	no_tokens_available_error: {
		en: 'No tokens available',
		pt: 'Sem tokens disponíveis',
	},
	token_encryption_error: {
		en: 'Error encrypting the token',
		pt: 'Erro ao encriptar o token',
	},
	token_fetch_error: {
		en: 'Error obtaining a token',
		pt: 'Erro ao obter um token',
	},
	no_active_subscription_error: {
		en: 'You don\'t have an active subscription',
		pt: 'Não tem uma subscrição ativa',
	},
	negative_balance_error: {
		en: 'It\'s not possible to unlock bicycles if your balance is negative',
		pt: 'Não é possível desbloquear bicicletas se o seu saldo for negativo',
	},
	location_determination_error: {
		en: 'It was not possible to determine your position',
		pt: 'Não foi possível determinar a sua posição',
	},
	not_close_enough_error: {
		en: 'You\'re not close enough to the station',
		pt: 'Não está perto o suficiente da estação',
	},
	bike_unlock_error: {
		en: 'It was not possible to unlock the bicycle',
		pt: 'Não foi possível desbloquear a bicicleta',
	},
	service_hours_error: {
		en: 'Service unavailable. Hours of operation between 06:00 and 02:00.',
		pt: 'Serviço indisponível. Horário de utilização entre as 06:00 e as 02:00.',
	},
};