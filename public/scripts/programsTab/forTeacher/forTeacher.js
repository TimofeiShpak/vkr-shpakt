let table;
let lastIndex = 0;
let typeIndex = 1;
let firstPeriodHours = 0;
let secondPeriodHours = 0;
let tablewidth = [4,14,14,14,6,6,6,6,6,6];

let subjectIndex = 0;
let typeWorkloadIndex = 1;
let hoursIndex = 3;
let specialtyIndex = 4;
let formEducationIndex = 6;
let semestrIndex = 8; 
let importTableLength = 11;

let datatablePointIndex = 0;
let datatableTypeWorkloadIndex = 1;
let datatableSubjectIndex = 2;
let datatableGroupIndex = 3;
let hoursOneIndex = 4;
let hoursTwoIndex = 6;
let allHoursIndex = 8;
let datableLength = 10;

let additionalTypesName = 'Установочные';
let lectureName = 'Лекции';
let secondLectureName = 'Коллоквиум';
let practiseName = 'Практические';

function initTable(data, columns) {
  $(document).ready(function() {
    table = $('#example').DataTable({
      // данные
      data: data,
      dom: 'Bfrtip',
      paging: false,
      ordering: false,
      info: false,
      searching: false,
      bAutoWidth: false, 
      select: true,
      columns : columns,
      // кнопка для скачивания в excel
      buttons: [{
        'extend': 'excel',
        text: 'Скачать excel',
        className: 'exportExcel',
        filename: 'list',
        title: null,
        createEmptyCells: true,
        exportOptions: {
          modifier: {
            page: 'all'
          },
          format: {
            body: function ( data ) {
              return `${data}`.split(' ').join('\r\n') 
            }
        }
        },
        customize: function (xlsx) {
          let sheet = xlsx.xl.worksheets['sheet1.xml'];
          $( 'row c', sheet ).attr( 's', '25' );
          let col = $('col', sheet);
            col.each(function (i) {
              $(this).attr('width', tablewidth[i]);
          });

        }
      }],
      // перевод
      "language": {
        "lengthMenu": "Показать _MENU_ студентов на странице",
        "zeroRecords": "Данных нет",
        "info": "Показать страницу _PAGE_ из _PAGES_",
        "infoEmpty": "Нет доступных записей",
        "infoFiltered": "(отфильтровано из _MAX_ всех записей)"
      },
    });
  });
}

function getDataTable(values, hours, nameType) {
  let datatable = [];
  let subjects = values.map(x => x[subjectIndex]);
  let specialty = values.map(x => x[specialtyIndex]);
  
  datatable[0] = [typeIndex, nameType, subjects[0], specialty[0]];
  setHours(hours[0], datatable[0])

  for (let i = 1; i < values.length; i++) {
    datatable[i] = [];
    datatable[i][datatableSubjectIndex] = subjects[i];
    datatable[i][datatableGroupIndex] = specialty[i];
    setHours(hours[i], datatable[i])
  }
  return datatable;
}

function getLastRow(datatable, hours) {
  lastIndex = datatable.length;
  datatable[lastIndex] = [];
  datatable[lastIndex][hoursOneIndex] = hours.reduce((sum,x) => sum+= +x['one'] || 0, 0);
  datatable[lastIndex][hoursTwoIndex] = hours.reduce((sum,x) => sum+= +x['two'] || 0, 0);
  if (datatable[lastIndex][hoursOneIndex] || datatable[lastIndex][hoursTwoIndex]) {
    firstPeriodHours += (datatable[lastIndex][hoursOneIndex] || 0);
    secondPeriodHours+=  (datatable[lastIndex][hoursTwoIndex] || 0);
    datatable[lastIndex][allHoursIndex] = (datatable[lastIndex][hoursOneIndex] || 0) + (datatable[lastIndex][hoursTwoIndex] || 0)
    datatable[lastIndex+1] = [];
    typeIndex++;
    return datatable;
  }
  return [];
}

function getHours(values, isFuture) {
  let hours = values.map(x => {
    let key = 'one';
    if (x[semestrIndex]%2 === 0 && !isFuture || x[semestrIndex]%2 === 1 && isFuture) {
      key = 'two'
    }
    return {
      [key]: x[hoursIndex],
    }
  })
  return hours;
}

function setHours(hours, row) {
  let allHours = 0;
  if (hours) {
    if (hours['one']) {
      row[hoursOneIndex] = hours['one']
      allHours+= +hours['one'];
    } else if(hours['two']) {
      row[hoursTwoIndex] = hours['two'];
      allHours+= +hours['two'];
    }
  }
  if (allHours) {
    row[allHoursIndex] = allHours;
  }
  return allHours;
}

function filterByType(values, typeFirst, typeSecond) {
  let typeValues = {};
  for (let i = 0; i < values.length; i++) {
    let type = values[i][typeFirst];
    if (typeSecond) {
      type = `${values[i][typeFirst]}-${values[i][typeSecond]}`
    }
    if (!typeValues[type]) {
      typeValues[type] = values[i]
    } else {
      if (values[i][hoursOneIndex]) {
        typeValues[type][hoursOneIndex] = (typeValues[type][hoursOneIndex] || 0) +values[i][hoursOneIndex];
      } else if (values[i][hoursTwoIndex]) {
        typeValues[type][hoursTwoIndex] = (typeValues[type][hoursTwoIndex] || 0) + values[i][hoursTwoIndex];
      }
      typeValues[type][allHoursIndex] = (typeValues[type][hoursTwoIndex] || 0) + (typeValues[type][hoursOneIndex] || 0);
    }
  }
  return Object.values(typeValues);
}

function prepareData(dataFuture, dataCurrent, nameType) {
  if (dataFuture.length || dataCurrent.length) {
    let dataHours = getHours(dataFuture, true).concat(getHours(dataCurrent))
    let data = getDataTable(dataFuture.concat(dataCurrent), dataHours, nameType)
    let filteredData = filterByType(data, datatableSubjectIndex, datatableGroupIndex);
    let wholeData = getLastRow(filteredData, dataHours);
    return wholeData;
  }
  return [];
}

function createData(allValues, generalType) {
  let type = 'очная';
  let additionalTypes = ['заочная', 'заочная сокращенная'];
  let mixType = ['очно-заочная'];
  let { name, additionalName, namesType, secondName } = generalType;

  let dataFuture = [];
  if (additionalName) {
    dataFuture = allValues.filter(x => x[typeWorkloadIndex].includes(additionalName) && x[formEducationIndex] === type)
  }
  let data = allValues.filter(x => x[typeWorkloadIndex].includes(name) && x[formEducationIndex] === type)
  if (secondName) {
    let secondData = allValues.filter(x => x[typeWorkloadIndex].includes(secondName) && x[formEducationIndex] === type);
    data = data.concat(secondData)
  }
  let preparedData = prepareData(dataFuture, data, namesType[0]);

  let additionalDataFuture = [];
  if (additionalName) {
    additionalDataFuture = allValues.filter(x => x[typeWorkloadIndex].includes(additionalName) && additionalTypes.includes(x[formEducationIndex]))
  }
  let additionalData = allValues.filter(x => x[typeWorkloadIndex].includes(name) && additionalTypes.includes(x[formEducationIndex]))
  let additionalPreparedData = prepareData(additionalDataFuture, additionalData, namesType[1]);
  preparedData = preparedData.concat(additionalPreparedData);

  let mixDataFuture = [];
  if (additionalName) {
    mixDataFuture = allValues.filter(x => x[typeWorkloadIndex].includes(additionalName) && mixType.includes(x[formEducationIndex]))
  }
  let mixData = allValues.filter(x => x[typeWorkloadIndex].includes(name) && mixType.includes(x[formEducationIndex]))
  if (secondName) {
    let secondData = allValues.filter(x => x[typeWorkloadIndex].includes(secondName) && mixType.includes(x[formEducationIndex]));
    mixData = mixData.concat(secondData)
  }
  let mixPreparedData = prepareData(mixDataFuture, mixData, namesType[2]);
  let datatable = preparedData.concat(mixPreparedData);

  return datatable;
}

function writeAllHours(datatable) {
  datatable[datatable.length] = [];
  let indexAllHours = datatable.length;
  datatable[indexAllHours] = [];
  datatable[indexAllHours][3] = 'Итог'
  datatable[indexAllHours][hoursOneIndex] = firstPeriodHours.toFixed(2);
  datatable[indexAllHours][hoursTwoIndex] = secondPeriodHours.toFixed(2);
  datatable[indexAllHours][allHoursIndex] = (+datatable[indexAllHours][hoursOneIndex] + +datatable[indexAllHours][hoursTwoIndex]).toFixed(2);
  return datatable;
}

function checkDataTable(datatable) {
  for (let i = 0; i < datatable.length; i++) {
    while (datatable[i][datatableSubjectIndex] && !datatable[i][allHoursIndex]) {
      if (datatable[i][datatablePointIndex]) {
        datatable[i+1][datatablePointIndex] = datatable[i][datatablePointIndex]
        datatable[i+1][datatableTypeWorkloadIndex] = datatable[i][datatableTypeWorkloadIndex]
      } 
      datatable.splice(i,1)
    }
    for (let j = 0; j < datableLength; j++) {
      if (!datatable[i][j]) {
        datatable[i][j] = '';
      } else {
        datatable[i][j] = `${datatable[i][j]}`.split(' ').join('\n') 
      }
    }
  }
  return datatable;
}

function unificationData(x) {
  let indexGroup = x[typeWorkloadIndex].search('гр.');
  if (indexGroup !== -1) {
    x[specialtyIndex] = x[typeWorkloadIndex].slice(indexGroup+3);
  }
  x[hoursIndex] = parseFloat(`${x[hoursIndex]}`.replace(',', '.'));
  x[semestrIndex] = parseFloat(x[semestrIndex]);
  return x;
}

function preparedTypes(values) {
  let preparedValues = values.map(x => {
    let value = x
    let indexGroup = x.search('гр.');
    if (indexGroup !== -1) {
      value = value.slice(0, indexGroup);
    }
    let indexMark = x.search('с оценкой');
    if (indexMark !== -1) {
      value = value.slice(0, indexMark);
    }
    return value.trim();
  })
  return preparedValues;
}

function changePlace(sortedTypes, name, index) {
  let practiseIndex = sortedTypes.findIndex(x => x.name === name);
  if (practiseIndex !== -1) {
    [sortedTypes[index], sortedTypes[practiseIndex]] = [sortedTypes[practiseIndex], sortedTypes[index]] 
  }
}

function sortTypes(types) {
  let sortedTypes = types.sort((a,b) => {
    if(a.name.toLowerCase() > b.name.toLowerCase()) {
      return 1;
    } else {
      return -1;
    }
  });
  changePlace(sortedTypes, lectureName, 0);
  changePlace(sortedTypes, practiseName, 1);  
  return sortedTypes;
}

function getTypes(values) {
  let preparedValues = preparedTypes(values);
  let uniqTypes = [...new Set(preparedValues)];
  let additinalType = uniqTypes.filter(x => x.includes(additionalTypesName));
  let genaralType = uniqTypes.filter(x => !x.includes(additionalTypesName));
  let secondTypeIndex = genaralType.findIndex(x => x.includes(secondLectureName));
  if (secondTypeIndex !== -1) {
    genaralType.splice(secondTypeIndex, 1);
  }
  let types = genaralType.map((type,i) => {
    let additionalName = '';
    if (additinalType.find(x => x.includes(type.toLowerCase()))) {
      additionalName = `${additionalTypesName} ${type.toLowerCase()}`
    }
    let secondName = '';
    if (type === lectureName) {
      secondName = secondLectureName;
    }
    let visibleType = type;
    if (visibleType.includes(practiseName)) {
      visibleType = 'Практика'
    }
    return {
      name: type,
      additionalName: additionalName,
      secondName: secondName,
      namesType: [`${visibleType} дневное обучение`, `${visibleType} заочное обучение`, `${visibleType} очно-заочное обучение`]
    }
  });
  let sortedTypes = sortTypes(types);
  return sortedTypes;
}

function init(XL_row_object) {
  let allValues = XL_row_object.map(x => Object.values(x))
    .filter(x => x.length === importTableLength)
    .map(x => unificationData(x));
  let types = allValues.map(x => x[typeWorkloadIndex]);
  let typesName = getTypes(types);

  let datatable = []
  datatable[0] = ['1','2','3','4','5','6','7','8','9','10']
  for (let i = 0; i < typesName.length; i++) {
    let data = createData(allValues, typesName[i]);
    datatable = datatable.concat(data);
  }
  datatable = writeAllHours(datatable);
  datatable = checkDataTable(datatable);
  let columns = []
  for (let i = 0; i < 10; i++) {
    columns.push({ title: `${i+1} - столбец` });
  }
  initTable(datatable, columns)
}

export function forTeacher() {
  $(document).ready(function(){
    $("#fileUploaderTeacher").change(function(evt){
          let selectedFile = evt.target.files[0];
          let reader = new FileReader();
          $(this).hide();
          reader.onload = function(event) {
            let data = event.target.result;
            let workbook = XLSX.read(data, {
                type: 'binary'
            });

            let XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]]);
            init(XL_row_object);

          };

          reader.onerror = function(event) {
            console.error("File could not be read! Code " + event.target.error.code);
          };

          reader.readAsBinaryString(selectedFile);
    });
  });
}