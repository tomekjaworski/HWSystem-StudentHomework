// eslint-disable-next-line no-unused-vars
const jsLocales = {
  pl: {
    main: {
      tasknumber: 'Numer',
      tasktitle: 'Tytul Zadania',
      taskfs: 'Status przesłania odpowiedzi',
      taskftc: 'Status nowych komentarzy',
      taskst: 'Status oceny prowadzącego',
      tasksm: 'Status testu maszynowego',
      tasksb: 'Status blokady',
      taskdeadline: 'Termin'
    },
    task: {
      removefile: {
        title: 'Usuwanie pliku',
        body (name) {
          return 'Czy na pewno chcesz skasować plik ' + name + '?'
        },
        button: 'Skasuj'
      },
      replacefile: {
        title (name) {
          return 'Podmiana pliku ' + name
        },
        button: 'Podmień plik'
      },
      showfile: {
        unsupported: 'Nieobsługiwane rozszezenie'
      }
    }
  },
  en: {
    main: {
      tasknumber: 'Number',
      tasktitle: 'Task Title',
      taskfs: 'Reply sent status',
      taskftc: 'New comment status',
      taskst: 'Teacher assessment status',
      tasksm: 'Automatic testing status',
      tasksb: 'Blocked status',
      taskdeadline: 'Deadline'
    },
    task: {
      removefile: {
        title: 'Removing file',
        body (name) {
          return 'Are you sure you want to remove file ' + name + '?'
        },
        button: 'Remove'
      },
      replacefile: {
        title (name) {
          return 'Replacing file ' + name
        },
        button: 'Replace file'
      },
      showfile: {
        unsupported: 'Unsupported extension'
      }
    }
  }
}

// eslint-disable-next-line no-unused-vars
let jsLocale = {}

if ($('html').attr('lang') === 'pl') {
  jsLocale = jsLocales.pl
} else {
  jsLocale = jsLocales.en
}