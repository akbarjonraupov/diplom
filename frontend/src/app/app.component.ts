import { Component, ElementRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

interface Step {
  type: "bot" | "start" | "question" | "milestone" | "final";
  text?: string;
  options?: string[];
}

interface ScoreResponse {
  profile: {
    name: string;
    strengths: string[];
    fields: string[];
    exams: string[];
    recommendations: string[];
  };
  percentage: number;
}

interface AuthResponse {
  ok: boolean;
  message: string;
  token?: string;
  user?: { name: string; email: string };
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  @ViewChild("messages") private messagesRef?: ElementRef<HTMLDivElement>;

  lang: "ru" | "tj" = "ru";
  ui = this.getUiStrings("ru");
  steps: Step[] = [];
  index = 0;
  messages: { type: string; text: string }[] = [];
  options: string[] = [];
  answers: number[] = [];
  currentStepType: Step["type"] | null = null;
  optionsDisabled = false;
  selectedOptionIndex: number | null = null;
  result: ScoreResponse | null = null;
  resultVisible = false;
  selectedTab: "result" | "path" | "recommendations" = "result";
  authMode: "login" | "register" = "login";
  authForm = {
    name: "",
    email: "",
    password: "",
  };
  authMessage = "";
  token = "";
  user: { name: string; email: string } | null = null;

  private readonly apiBase = "http://localhost:8000";

  constructor() {
    this.loadSteps(this.lang);
  }

  setAuthMode(mode: "login" | "register") {
    this.authMode = mode;
    this.authMessage = "";
  }

  async submitAuth() {
    const endpoint = this.authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const payload =
      this.authMode === "register"
        ? this.authForm
        : { email: this.authForm.email, password: this.authForm.password };

    const response = await fetch(`${this.apiBase}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as AuthResponse;
    this.authMessage = data.message;
    if (data.ok && data.token && data.user) {
      this.token = data.token;
      this.user = data.user;
    }
  }

  setLang(lang: "ru" | "tj") {
    this.lang = lang;
    this.ui = this.getUiStrings(lang);
    this.loadSteps(lang);
  }

  async loadSteps(lang: "ru" | "tj") {
    try {
      const response = await fetch(`${this.apiBase}/api/test?lang=${lang}`);
      const data = await response.json();
      this.steps = data.steps as Step[];
    } catch (error) {
      console.error("Failed to load steps", error);
      this.steps = [];
    }
    this.resetFlow();
  }

  resetFlow() {
    this.index = 0;
    this.messages = [];
    this.options = [];
    this.answers = [];
    this.resultVisible = false;
    this.result = null;
    this.selectedTab = "result";
    this.nextStep();
  }

  async requestScore() {
    const response = await fetch(`${this.apiBase}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: this.answers, lang: this.lang }),
    });
    this.result = (await response.json()) as ScoreResponse;
    this.resultVisible = true;
  }

  nextStep() {
    this.clearOptions();
    if (this.index >= this.steps.length) {
      return;
    }

    const step = this.steps[this.index];
    this.index += 1;

    if (step.type === "bot") {
      if (step.text) {
        this.appendMessage("bot", step.text);
      }
      if (step.options && step.options.length) {
        this.showOptions(step.type, step.options);
      } else {
        setTimeout(() => this.nextStep(), 250);
      }
      return;
    }

    if (step.type === "start") {
      if (step.options) {
        this.showOptions(step.type, step.options);
      }
      return;
    }

    if (step.type === "question") {
      if (step.text) {
        this.appendMessage("bot", step.text);
      }
      if (step.options) {
        this.showOptions(step.type, step.options);
      }
      return;
    }

    if (step.type === "milestone") {
      if (step.text) {
        this.appendMessage("milestone", step.text);
      }
      setTimeout(() => this.nextStep(), 350);
      return;
    }

    if (step.type === "final") {
      if (step.text) {
        this.appendMessage("milestone", step.text);
      }
      this.requestScore().finally(() => {
        this.showOptions("final", [this.ui.restartLabel]);
      });
    }
  }

  onOptionSelect(index: number) {
    if (this.optionsDisabled || this.selectedOptionIndex !== null) {
      return;
    }

    this.optionsDisabled = true;
    this.selectedOptionIndex = index;
    const optionText = this.options[index];
    if (optionText) {
      this.appendMessage("user", optionText);
    }

    if (this.currentStepType === "question") {
      this.answers.push(index);
    }

    if (this.currentStepType === "final") {
      setTimeout(() => this.resetFlow(), 300);
      return;
    }

    setTimeout(() => this.nextStep(), 350);
  }

  setTab(tab: "result" | "path" | "recommendations") {
    this.selectedTab = tab;
  }

  private showOptions(stepType: Step["type"], options: string[]) {
    this.currentStepType = stepType;
    this.options = options;
    this.optionsDisabled = false;
    this.selectedOptionIndex = null;
  }

  private clearOptions() {
    this.options = [];
    this.currentStepType = null;
    this.optionsDisabled = false;
    this.selectedOptionIndex = null;
  }

  private appendMessage(type: string, text: string) {
    this.messages = [...this.messages, { type, text }];
    setTimeout(() => {
      this.messagesRef?.nativeElement.lastElementChild?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 0);
  }

  private getUiStrings(lang: "ru" | "tj") {
    if (lang === "tj") {
      return {
        eyebrow: "Тести касбсамтгирӣ",
        title: "Ҷавобҳоро интихоб кунед — мо касби орзуиро меёбем",
        meta: "⏱ 15 дақиқа · 16 савол",
        resultTab: "Натиҷа",
        pathTab: "Қабул",
        recommendationsTab: "Тавсияҳо",
        resultKicker: "Профили шумо",
        resultTitle: "Чӣ тавр ба касби орзуӣ расидан",
        resultLead:
          "Мо профили асосии шуморо муайян кардем ва самтҳое интихоб намудем, ки истеъдодро боз мекунанд.",
        restartLabel: "Боз оғоз кардан",
        scorePrefix: "Мутобиқат",
        authTitle: "Вуруд ё бақайдгирӣ",
        login: "Вуруд",
        register: "Бақайдгирӣ",
        name: "Ном",
        email: "Email",
        password: "Рамз",
        submit: "Идома",
      };
    }
    return {
      eyebrow: "Профориентационный тест",
      title: "Выберите ответы — и мы подберем профессию мечты",
      meta: "⏱ 15 минут · 16 вопросов",
      resultTab: "Результат",
      pathTab: "Поступление",
      recommendationsTab: "Рекомендации",
      resultKicker: "Твой профиль",
      resultTitle: "Как получить профессию мечты",
      resultLead:
        "Мы определили твой ведущий профиль и подобрали направления, которые помогут раскрыть таланты.",
      restartLabel: "Пройти ещё раз",
      scorePrefix: "Совпадение",
      authTitle: "Вход или регистрация",
      login: "Вход",
      register: "Регистрация",
      name: "Имя",
      email: "Email",
      password: "Пароль",
      submit: "Продолжить",
    };
  }
}
