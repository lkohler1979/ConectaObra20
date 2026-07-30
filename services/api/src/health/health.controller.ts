import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return { status: "ok-hotreload-test", timestamp: new Date().toISOString() };
  }
}
