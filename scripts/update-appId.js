import { promises as fs } from 'fs';

const files = [
	'android/app/build.gradle',
	'android/app/src/main/res/values/strings.xml',
	'ios/App/App/Info.plist',
	'ios/App/App.xcodeproj/project.pbxproj',
];

for (const file of files) {
	let content = await fs.readFile(file, 'utf8');
	if (process.argv[2] === '--dev') {
		content = content.replaceAll(/(?<!namespace ")dev\.tteles\.gira/g, 'dev.tteles.gira.dev');
		content = content.replaceAll('Gira+', 'Gira+ Dev');
	} else {
		content = content.replaceAll(/(?<!namespace ")dev\.tteles\.gira\.dev/g, 'dev.tteles.gira');
		content = content.replaceAll('Gira+ Dev', 'Gira+');
	}
	await fs.writeFile(file, content, 'utf8');
}