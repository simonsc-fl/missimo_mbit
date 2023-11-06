/**
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
        return true;
    }

    //% blockId=missimo_measure_dist
    //% block="Messe Distanz in cm||Trigger $trigger|Echo $echo"
    //% blockHidden=true
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
        control.waitMicros(2);
        pins.digitalWritePin(trigger, 1);
        control.waitMicros(15);
        pins.digitalWritePin(trigger, 0);

        // read pulse and convert to cm
        let d = pins.pulseIn(echo, PulseValue.High, 23200);
        return Math.floor(d / 58.2);
    }

    //% blockId=missimo_measure_dist_avg
    //% block="Messe Distanz in cm"
    //% block.loc.en="measure distance in cm"
    //% jsdoc.loc.en="measure distance in cm"
    //% color=#25db9c
    //% weight=100
    //% blockGap=10
    //% group="Sensor"
    export function measure_distance_avg(): number {
        let oldDist = measure_distance(TRIGGER_PIN, ECHO_PIN);
        let avg = oldDist;
        for (let index = 0; index <= 10; index++) {
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
        
        let pulseVal = 0;
        if (value == 0) {
            pulseVal = SERVO_PULSE_CENTER;
        }
        else {
            pulseVal = pins.map(value, -100, 100, SERVO_PULSE_MIN, SERVO_PULSE_MAX);
        }

        // set new pulse only if necessary
        if (update_servo_pulse(sType, pulseVal)) {
            let pin = get_servo_pin(sType);
            pins.servoSetPulse(pin, pulseVal);
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
        let pin = get_servo_pin(sType);
        pins.servoSetPulse(pin, SERVO_PULSE_CENTER);
    }
}