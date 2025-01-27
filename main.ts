﻿/**
 * Functions are mapped to blocks using various macros
 * in comments starting with %. The most important macro
 * is "block", and it specifies that a block should be
 * generated for an **exported** function.
 */

//% weight=0 icon="\uf1b9" color=#25db9c
namespace Missimo {

    // rover pin mapping
    //% enumIdentity="DigitalPin.P8"
    const TRIGGER_PIN = DigitalPin.P8;
    //% enumIdentity="DigitalPin.P2"
    const ECHO_PIN = DigitalPin.P2;

    //% enumIdentity="AnalogPin.P0"
    const SERVO_L_PIN = AnalogPin.P0;
    //% enumIdentity="AnalogPin.P1"
    const SERVO_R_PIN = AnalogPin.P1;

    //% enumIdentity="AnalogPin.P13"
    const LED_FRONT_RIGHT = AnalogPin.P13;
    //% enumIdentity="AnalogPin.P16"
    const LED_FRONT_LEFT = AnalogPin.P16;

    //% enumIdentity="AnalogPin.P14"
    const LED_BACK_RIGHT = AnalogPin.P14;
    //% enumIdentity="AnalogPin.P15"
    const LED_BACK_LEFT = AnalogPin.P15;

    // variables
    let timeAtLastMeasure = 0;

    const SERVO_PULSE_MIN = 1200;
    const SERVO_PULSE_MAX = 1800;
    const SERVO_PULSE_CENTER = 1500;

    let cur_servo_l_pulse = -1;
    let cur_servo_r_pulse = -1;

    // enums
    export enum ServoType {
        //% blockId="Servo_Type_Left" block="Servo links"  
        SERVO_L,
        //% blockId="Servo_Type_Right" block="Servo rechts"  
        SERVO_R
    }

    export enum LedType {
        //% blockId="Led_Type_Front" block="LED vorne"
        LED_FRONT,
        //% blockId="Led_Type_Back" block="LED hinten"
        LED_BACK
    }

    // map servo type to pin
    function get_servo_pin(sType: ServoType): AnalogPin {
        if (sType == ServoType.SERVO_L) {
            return SERVO_L_PIN;
        }
        else {
            return SERVO_R_PIN;
        }
    }

    // update current pulse and return if updated
    function update_servo_pulse(sType: ServoType, value: number): boolean {
        // clamp value
        if (value < SERVO_PULSE_MIN) {
            value = SERVO_PULSE_MIN;
        }
        else if (value > SERVO_PULSE_MAX) {
            value = SERVO_PULSE_MAX;
        }

        // update current value
        if (sType == ServoType.SERVO_L) {
            if (cur_servo_l_pulse == value) {
                return false;
            }
            cur_servo_l_pulse = value;
        }
        else {
            if (cur_servo_r_pulse == value) {
                return false;
            }
            cur_servo_r_pulse = value;
        }

        // write to pin
        let pin = get_servo_pin(sType);
        pins.servoSetPulse(pin, value);
        return true;
    }

    //% blockId=missimo_measure_dist
    //% block="Messe Distanz in cm||Trigger $trigger Echo $echo"
    //% blockHidden=false
    //% color=#25db9c
    //% weight=100
    //% blockGap=10
    //% trigger.fieldEditor="gridpicker"
    //% trigger.fieldOptions.columns=4
    //% trigger.defl=DigitalPin.P8
    //% echo.fieldEditor="gridpicker"
    //% echo.fieldOptions.columns=4
    //% echo.defl=DigitalPin.P2
    //% group="Sensor"
    export function measure_distance(trigger: DigitalPin, echo: DigitalPin = DigitalPin.P2): number {
        
        let now = control.micros();
        let dt = now - timeAtLastMeasure;
        if (dt < 20000) {
            control.waitMicros(dt + 100);
        } 
        timeAtLastMeasure = now;
        
        // send trigger pulse
        pins.setPull(trigger, PinPullMode.PullNone);
        pins.digitalWritePin(trigger, 0);
        control.waitMicros(5);
        pins.digitalWritePin(trigger, 1);
        control.waitMicros(15);
        pins.digitalWritePin(trigger, 0);

        // read pulse and convert to cm
        let d = pins.pulseIn(echo, PulseValue.High, 23200);
        return Math.floor(d / 58.2);
    }

    //% blockId=missimo_measure_dist_avg
    //% block="Messe Distanz in cm (gefilteret)"
    //% block.loc.en="measure distance in cm"
    //% jsdoc.loc.en="measure distance in cm"
    //% color=#25db9c
    //% weight=100
    //% blockGap=10
    //% group="Sensor"
    export function measure_distance_avg(): number {
        let oldDist = measure_distance(TRIGGER_PIN, ECHO_PIN);
        let avg = oldDist;
        for (let index = 0; index <= 5; index++) {
            let dist = measure_distance(TRIGGER_PIN, ECHO_PIN);
            if (dist == 0) {
                continue;
            }

            avg = (0.8 * oldDist) + (0.2 * dist);
            control.waitMicros(10);
        }
        return Math.floor(avg);
    }

    //% blockId=missimo_servo_run
    //% block="$sType läuft mit $value Prozent"
    //% color=#25db9c
    //% weight=100
    //% blockGap=10
    //% sType.defl=ServoType.SERVO_L
    //% value.min=-100 value.max=100 value.defl=0
    //% group="Servo"
    export function servo_run(sType: ServoType, value: number): void {
        if (value == 0) {
            update_servo_pulse(sType, SERVO_PULSE_CENTER)
        }
        else {
            let pulseVal = pins.map(value, -100, 100, SERVO_PULSE_MIN, SERVO_PULSE_MAX);
            update_servo_pulse(sType, pulseVal)
        }
    }

    //% blockId=missimo_servo_stop
    //% block="Stoppe $sType"
    //% color=#25db9c
    //% weight=100
    //% blockGap=10
    //% sType.defl=ServoType.SERVO_L
    //% group="Servo"
    export function servo_stop(sType: ServoType): void {
        update_servo_pulse(sType, SERVO_PULSE_CENTER);
    }

    //% blockId=missimo_led_on
    //% block="Schalte $led ein"
    //% color=#25db9c
    //% weight=100
    //% blockGap=10
    //% sType.defl=LedType.LED_FRONT
    //% group="LED"
    export function led_on(led: LedType): void {
        if (led == LedType.LED_FRONT) {
            pins.analogWritePin(LED_FRONT_RIGHT, 255);
            pins.analogWritePin(LED_FRONT_LEFT, 255);
        }
        else {
            pins.analogWritePin(LED_BACK_RIGHT, 255);
            pins.analogWritePin(LED_BACK_LEFT, 255);
        }
    }

    //% blockId=missimo_led_off
    //% block="Schalte $led aus"
    //% color=#25db9c
    //% weight=100
    //% blockGap=10
    //% sType.defl=LedType.LED_FRONT
    //% group="LED"
    export function led_off(led: LedType): void {
        if (led == LedType.LED_FRONT) {
            pins.analogWritePin(LED_FRONT_RIGHT, 0);
            pins.analogWritePin(LED_FRONT_LEFT, 0);
        }
        else {
            pins.analogWritePin(LED_BACK_RIGHT, 0);
            pins.analogWritePin(LED_BACK_LEFT, 0);
        }
    }
}