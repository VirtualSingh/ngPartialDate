import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { noop } from 'rxjs';

@Component({
  selector: 'app-partial-date',
  templateUrl: './partial-date.component.html',
  styleUrls: ['./partial-date.component.scss'],
})
export class PartialDateComponent implements OnInit {
  partialDateForm: UntypedFormGroup = new UntypedFormGroup({
    day: new UntypedFormControl(null),
    month: new UntypedFormControl(null),
    year: new UntypedFormControl(null),
    empty: new UntypedFormControl(),
    other: new UntypedFormControl(null),
    partialDateInput: new UntypedFormControl(null),
  });
  disabled!: boolean;
  filteredDay: any = [];
  filteredMonth: any = [];
  filteredYear: any = [];
  thirtyMonth: any = [];
  @Input() reset!: boolean;
  @Input() isMandatory: boolean = false;
  @Input() formFactoryData: any;
  @Input() fieldName: any;
  @Input() extraYears: number = 0; // Future years support
  @Input() disablePartial = false;
  initialTime: boolean = false;

  // partial date new implementation
  monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  showCalendar: boolean = false;
  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  partialSelectedYear: number | null = null;
  partialSelectedMonth: number | null = null;
  currentYear!: number;
  currentMonth!: number;
  partialDate: boolean = false;
  days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendar: { date: Date | null }[][] = [];
  dateVal: string = '';
  startYear!: number;
  endYear!: number;
  years!: number[][];
  @ViewChild('partialDateBtn') partialDateBtn!: ElementRef;
  // @ViewChild('op', { static: false }) overlaypanel!: OverlayPanel;
  yearRange: any[] = [];
  isDropdownOpen = false;
  activeDropdown: 'month' | 'year' | null = null;
  showOverlay = false;

  constructor(private fb: UntypedFormBuilder, private elRef: ElementRef) {}
  @HostListener('document:click', ['$event'])
  hideCalendar(event: Event) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showCalendar = false;
    }
  }

  ngOnInit() {
    // custom partial date changes --start----
    this.selectedDate = this.currentDate;
    this.currentYear = this.currentDate.getFullYear();
    this.currentMonth = this.currentDate.getMonth();
    this.generateCalendar();
    this.updateYearsGrid();
    this.populateYearRange();
    // custom partial date changes --end----

    const COMPONENT = this;
    let year = new Date().getFullYear();
    year = year ? year + this.extraYears : year;
    for (var i = year; i >= year - 150; i--) {
      COMPONENT.filteredYear.push({ label: i.toString(), value: i.toString() });
    }
    COMPONENT.updateDay(31);
    COMPONENT.thirtyMonth = ['Feb', 'Apr', 'Jun', 'Sep', 'Nov'];
    COMPONENT.filteredMonth = [
      { value: 'Jan', label: 'Jan' },
      { value: 'Feb', label: 'Feb' },
      { value: 'Mar', label: 'Mar' },
      {
        value: 'Apr',
        label: 'Apr',
      },
      { value: 'May', label: 'May' },
      { value: 'Jun', label: 'Jun' },
      { value: 'Jul', label: 'Jul' },
      {
        value: 'Aug',
        label: 'Aug',
      },
      { value: 'Sep', label: 'Sep' },
      { value: 'Oct', label: 'Oct' },
      { value: 'Nov', label: 'Nov' },
      { value: 'Dec', label: 'Dec' },
    ];

    // COMPONENT.partialDateForm.valueChanges.subscribe((date) => {
    //   if (((COMPONENT.partialDateForm.get('day').value != null || COMPONENT.partialDateForm.get('month').value != null) && COMPONENT.partialDateForm.get('year').invalid) || ((COMPONENT.partialDateForm.get('day').value != null) && COMPONENT.partialDateForm.get('month').invalid)) {
    //     COMPONENT.isNotValid = true;
    //   } else {
    //     COMPONENT.isNotValid = false;
    //   }
    //   COMPONENT.onChange({ ...COMPONENT.partialDateForm.getRawValue(), ...{ isNotValid: COMPONENT.isNotValid } });
    // });

    COMPONENT.partialDateForm.get('day').valueChanges.subscribe((day) => {
      if (day != null) {
        COMPONENT.partialDateForm
          .get('month')
          .setValidators([Validators.required]);
        COMPONENT.partialDateForm
          .get('year')
          .setValidators([Validators.required]);
      } else {
        COMPONENT.partialDateForm.get('month').setValidators([]);
        COMPONENT.partialDateForm.get('year').setValidators([]);
      }
      COMPONENT.partialDateForm.get('month').updateValueAndValidity();
      COMPONENT.partialDateForm.get('year').updateValueAndValidity();
    });

    COMPONENT.partialDateForm.get('month').valueChanges.subscribe((month) => {
      if (month != null) {
        COMPONENT.partialDateForm
          .get('year')
          .setValidators([Validators.required]);
      } else {
        COMPONENT.partialDateForm.get('year').setValidators([]);
      }
      if (COMPONENT.thirtyMonth.includes(month)) {
        if (month == 'Feb') {
          COMPONENT.updateDay(29);
        } else {
          COMPONENT.updateDay(30);
        }
      } else {
        COMPONENT.updateDay(31);
      }
      COMPONENT.partialDateForm.get('year').updateValueAndValidity();
    });
    COMPONENT.partialDateForm.get('year').valueChanges.subscribe((yr) => {
      if (yr != null) {
        if (
          !COMPONENT.leapYear(yr) &&
          COMPONENT.partialDateForm.get('month').value &&
          COMPONENT.partialDateForm.get('month').value == 'Feb'
        ) {
          COMPONENT.updateDay(28);
        } else if (
          COMPONENT.leapYear(yr) &&
          COMPONENT.partialDateForm.get('month').value &&
          COMPONENT.partialDateForm.get('month').value == 'Feb'
        ) {
          COMPONENT.updateDay(29);
        }
      }
    });

    if (
      this.currentMonth &&
      this.monthNames?.[this.currentMonth] &&
      this.currentYear
    ) {
      const dateObj = new PartialDate();
      dateObj.month = this.monthNames[this.currentMonth];
      dateObj.year = this.currentYear;
      COMPONENT.partialDateForm.patchValue(dateObj, {
        onlySelf: true,
        emitEvent: false,
      });
    }
  }

  leapYear(year: number) {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
  }

  updateDay(day: number) {
    const COMPONENT = this;
    COMPONENT.filteredDay = [];
    for (var i = 1; i <= day; i++) {
      COMPONENT.filteredDay.push({ label: i.toString(), value: i.toString() });
    }
  }

  writeValue(value: PartialDate): void {
    const COMPONENT = this;
    if (value != null && Object.keys(value).length > 0) {
      if (
        typeof value.year != 'string' &&
        value.year != null &&
        typeof value.year == 'number'
      )
        value.year = String(value.year);
      if (
        typeof value.day != 'string' &&
        value.day != null &&
        typeof value.day == 'number'
      )
        value.day = String(value.day);
      COMPONENT.partialDateForm.patchValue({
        day: value ? value.day : null,
        month: value ? value.month : null,
        year: value ? value.year : null,
        partialDateInput: value ? value.partialDateInput : null,
      });
      if (!COMPONENT.partialDateForm.get('partialDateInput').value) {
        let partialDateValue;
        if (value.day && value.month && value.year && !value.partialDateInput) {
          partialDateValue = `${value.day}-${value.month}-${value.year}`;
        } else if (!value.day && value.month && value.year) {
          partialDateValue = `${value.month}-${value.year}`;
        } else if (!value.day && !value.month && value.year) {
          partialDateValue = `${value.year}`;
        }
        COMPONENT.partialDateForm.patchValue({
          partialDateInput: partialDateValue,
        });
      }
    } else {
      COMPONENT.partialDateForm.setValue(new PartialDate());
    }

    // if (COMPONENT.partialDateForm.get('other') != null && !COMPONENT.partialDateForm.get('other').disabled) {
    //   if (value != null && value.other != null) {
    //     COMPONENT.partialDateForm.get('day').reset();
    //     COMPONENT.partialDateForm.get('month').reset();
    //     COMPONENT.partialDateForm.get('year').reset();
    //     COMPONENT.partialDateForm.get('day').disable();
    //     COMPONENT.partialDateForm.get('month').disable();
    //     COMPONENT.partialDateForm.get('year').disable();
    //   } else {
    //     COMPONENT.partialDateForm.get('day').enable();
    //     COMPONENT.partialDateForm.get('month').enable();
    //     COMPONENT.partialDateForm.get('year').enable();
    //   }
    // }
  }

  // partial date new implementation
  toggleCalendar(event?: any) {
    if (event?.target?.value == '' || event?.target?.value == undefined) {
      this.showCalendar = !this.showCalendar;
      const dateObj = new PartialDate();
      dateObj.month = this.monthNames[new Date().getMonth()];
      dateObj.year = new Date().getFullYear();
      this.partialDateForm.patchValue(dateObj, {
        onlySelf: true,
        emitEvent: false,
      });
      this.generateCalendar();
      this.closeDropdown();
    } else {
      const selectedDateArr = event?.target?.value?.split('-');
      if (selectedDateArr?.length > 0) {
        if (selectedDateArr.length == 3 && !isNaN(selectedDateArr[0])) {
          this.showCalendar = !this.showCalendar;
        } else if (
          (selectedDateArr.length == 1 &&
            selectedDateArr[0].length == 4 &&
            !isNaN(selectedDateArr[0])) ||
          this.monthNames.includes(selectedDateArr[0])
        ) {
          // this.overlaypanel.show(event);
          this.showOverlay = true;
        }
      }
    }
  }

  togglePartialDate(event: any) {
    this.partialDate = true;
    this.showCalendar = false;
    // this.overlaypanel.show(event);
    this.showOverlay = true;
    this.dateVal = null;
    this.partialDateForm.patchValue(
      { partialDateInput: null },
      { onlySelf: true, emitEvent: false }
    );
    this.selectedDate = null;
    this.preventClosing(event);
  }

  preventClosing(event: Event) {
    event.stopPropagation();
  }

  generateCalendar() {
    const firstDayOfMonth = new Date(
      this.currentYear,
      this.currentMonth,
      1
    ).getDay();
    const daysInMonth = new Date(
      this.currentYear,
      this.currentMonth + 1,
      0
    ).getDate();

    this.calendar = [];
    let currentWeek: { date: Date | null }[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push({ date: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push({
        date: new Date(this.currentYear, this.currentMonth, day),
      });
      if (currentWeek.length === 7) {
        this.calendar.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: null });
      }
      this.calendar.push(currentWeek);
    }
  }

  prevMonth() {
    if (this.currentMonth > 0) {
      this.currentMonth--;
    } else {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (
      this.currentYear < currentYear ||
      (this.currentYear === currentYear && this.currentMonth < currentMonth) ||
      this.yearRange.includes(this.currentYear)
    ) {
      if (this.currentMonth < 11) {
        this.currentMonth++;
        this.onMonthChange(this.monthNames[this.currentMonth]);
      } else {
        this.currentMonth = 0;
        this.currentYear++;
        this.onYearChange(this.currentYear);
      }
      this.generateCalendar();
    }
  }

  clearAndEnterNewDate() {
    this.selectedDate = null;
    this.dateVal = '';
    this.showCalendar = false;
    this.partialSelectedYear = null;
    this.partialSelectedMonth = null;
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.partialDateForm.reset();
  }

  isSelected(dateObj: { date: Date | null }) {
    return (
      dateObj.date &&
      (this.selectedDate ||
        this.partialDateForm.get('partialDateInput').value) &&
      dateObj.date.getTime() ===
        (this.partialDateForm.get('partialDateInput').value
          ? new Date(
              this.partialDateForm.get('partialDateInput').value
            ).getTime()
          : this.selectedDate.getTime())
    );
  }

  isFutureDate(day: any): boolean {
    let isFutureDate = false;
    if (day.date && !this.extraYears) {
      isFutureDate = day.date > new Date();
    }
    return isFutureDate;
  }

  isToday(dateObj: { date: Date | null }) {
    const today = new Date();
    return (
      dateObj.date &&
      dateObj.date.getFullYear() === today.getFullYear() &&
      dateObj.date.getMonth() === today.getMonth() &&
      dateObj.date.getDate() === today.getDate()
    );
  }

  isNextArrowVisible(): boolean {
    return this.currentYear < 2024;
  }

  selectDate(dateObj: { date: Date | null }) {
    if (dateObj.date) {
      const day =
        (dateObj.date.getDate() < 10 ? '0' : '') + dateObj.date.getDate();
      const month = this.monthNames[dateObj.date.getMonth()];
      const year = String(dateObj.date.getFullYear());
      this.dateVal = this.formatDate(dateObj.date);
      const obj = {
        day: day,
        month: month,
        year: year,
        partialDateInput: this.dateVal,
      };
      this.selectedDate = dateObj.date;
      let dateArr = this.dateVal.split('-');
      this.currentYear = Number(dateArr[2]);
      this.showCalendar = false;
      this.writeValue(obj);
      this.closeDropdown();
    }
  }

  formatDate(date: Date): string {
    const month = this.monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${
      (date.getDate() < 10 ? '0' : '') + date.getDate()
    }-${month}-${year}`;
  }

  toggleFullDate(event: any) {
    this.partialDate = false;
    this.showCalendar = true;
    // this.overlaypanel.hide();
    this.showOverlay = false;
    this.showOverlay = false;
    this.dateVal = null;
    this.selectedDate = null;
    this.preventClosing(event);
    this.partialSelectedMonth = null;
    this.partialSelectedYear = null;
    const dateObj = new PartialDate();
    if (
      !this.partialSelectedMonth &&
      !this.partialSelectedYear &&
      this.partialDateForm?.value?.day &&
      this.partialDateForm?.value?.month &&
      this.partialDateForm?.value?.year
    ) {
      dateObj.day = this.partialDateForm.value.day;
      dateObj.month = this.partialDateForm.value.month;
      dateObj.year = this.partialDateForm.value.year;
      dateObj.partialDateInput = `${dateObj.day}-${dateObj.month}-${dateObj.year}`;
    } else {
      this.currentYear = this.currentDate.getFullYear();
      this.currentMonth = this.currentDate.getMonth();
      dateObj.month = this.monthNames[this.currentMonth];
      dateObj.year = this.currentYear;
    }
    this.partialDateForm.patchValue(dateObj, {
      onlySelf: true,
      emitEvent: false,
    });
  }

  updateYearsGrid() {
    this.startYear = this.currentYear - 7;
    this.endYear = this.currentYear;
    this.years = [];
    for (let i = this.startYear; i <= this.endYear; i += 2) {
      this.years.push([i, i + 1]);
    }
  }

  nextYears() {
    const nextYear = this.currentYear + 8;
    let endYear = this.extraYears
      ? new Date().getFullYear() + this.extraYears
      : new Date().getFullYear();
    if (nextYear <= endYear) {
      this.currentYear = nextYear;
    } else {
      this.currentYear = new Date().getFullYear();
    }
    this.updateYearsGrid();
  }

  previousYears() {
    this.currentYear -= 8;
    this.updateYearsGrid();
  }

  isPartialYearSelected(year: number): boolean {
    return this.partialSelectedYear === year;
  }

  isPartialMonthSelected(monthIndex: number): boolean {
    const currentMonthIndex = new Date().getMonth();
    const maxMonthIndex = this.partialSelectedYear === 2024 ? 5 : 11;
    return (
      this.partialSelectedMonth === monthIndex &&
      ((this.partialSelectedYear === new Date().getFullYear() &&
        monthIndex <= currentMonthIndex) ||
        (this.partialSelectedYear === 2024 && monthIndex <= maxMonthIndex) ||
        this.partialSelectedYear !== new Date().getFullYear())
    );
  }

  isCurrentYear(year: number): boolean {
    const currentDate = new Date();
    return year === currentDate.getFullYear();
  }

  isCurrentMonth(monthIndex: number): boolean {
    const currentDate = new Date();
    return (
      monthIndex === currentDate.getMonth() &&
      this.partialSelectedYear === currentDate.getFullYear()
    );
  }

  setCurrentYear(year: number) {
    this.partialSelectedYear = year;
    const dateObj = new PartialDate();
    if (
      this.partialSelectedMonth &&
      this.monthNames?.[this.partialSelectedMonth]
    ) {
      dateObj.month = this.monthNames[this.partialSelectedMonth];
      dateObj.year = year;
      dateObj.partialDateInput = `${
        this.monthNames[this.partialSelectedMonth]
      }-${this.partialSelectedYear}`;
    } else {
      dateObj.year = year;
      dateObj.partialDateInput = `${year}`;
    }
    this.writeValue(dateObj);
  }

  isMonthSelectable(monthIndex: number): boolean {
    if (!this.partialSelectedYear) return false;
    const currentMonthIndex = new Date().getMonth();
    // const maxMonthIndex = this.partialSelectedYear === 2024 ? 5 : 11;
    return (
      this.partialSelectedYear !== new Date().getFullYear() ||
      monthIndex <= currentMonthIndex
    );
  }

  setCurrentMonth(month: any) {
    const monthIndex = this.monthNames.findIndex(
      (x) => x.toLowerCase() === month.toLowerCase()
    );
    const currentMonthIndex = new Date().getMonth();
    this.partialSelectedMonth = monthIndex;
    if (
      monthIndex <= currentMonthIndex &&
      this.partialSelectedYear !== null &&
      this.partialSelectedMonth !== null
    ) {
      const dateObj = new PartialDate();
      if (this.monthNames?.[monthIndex])
        dateObj.month = this.monthNames[monthIndex];
      if (this.partialSelectedYear) dateObj.year = this.partialSelectedYear;
      dateObj.partialDateInput = `${
        this.monthNames[this.partialSelectedMonth]
      }-${this.partialSelectedYear}`;
      this.showOverlay = false;
      this.writeValue(dateObj);
    }
  }
  populateYearRange() {
    const startYear = this.currentYear - 20;
    const years = this.extraYears
      ? this.currentYear + this.extraYears
      : this.currentYear;
    for (let i = years; i >= startYear; i--) {
      this.yearRange.push(i);
    }
  }
  onMonthChange(month: any) {
    const monthIndex = this.monthNames.findIndex((x) => x == month);
    if (monthIndex > -1) this.currentMonth = monthIndex;
    this.partialDateForm.patchValue(
      { month: this.monthNames[this.currentMonth] },
      { onlySelf: true, emitEvent: false }
    );
    this.generateCalendar();
    this.closeDropdown();
  }

  onYearChange(year: any) {
    this.currentYear = year;
    this.partialDateForm.patchValue(
      { year: this.currentYear },
      { onlySelf: true, emitEvent: false }
    );
    this.generateCalendar();
    this.closeDropdown();
    // this.preventClosing(event)
  }
  toggleDropdown(type: 'month' | 'year'): void {
    if (this.activeDropdown === type && this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.activeDropdown = type;
      this.isDropdownOpen = true;
    }
  }
  closeDropdown(): void {
    this.isDropdownOpen = false;
    this.activeDropdown = null;
  }
}

class PartialDate {
  day: string | number | null;
  month: string | null;
  year: string | number | null;
  partialDateInput: string;

  constructor() {
    this.day = null;
    this.month = null;
    this.year = null;
    this.partialDateInput = null;
  }
}
