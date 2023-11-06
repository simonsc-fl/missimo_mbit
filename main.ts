/*
Missimo workshop kit extension
*/


//% weight=0 icon="\uf1b9" color=#25db9c
namespace Missimo {

    // hold time at last measurement
    let timeAtLastMeasure = 0;

    //% blockId=missimo_ultrasonic
    //% block="Messe Distanz|Trigger $trigger|Echo $echo"
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
    export function measure_distance(trigger: DigitalPin, echo: DigitalPin = DigitalPin.P2): number {

        // make sure there is at least 20ms between each measurement
        let now = control.micros();
        let dt = now - timeAtLastMeasure;
        if (dt < 20000)
        {
            control.waitMicros(dt + 100);
        } 
        timeAtLastMeasure = now;

        // send trigger pulse
        pins.setPull(trigger, PinPullMode.PullNone);
        pins.digitalWritePin(trigger, 0);
        control.waitMicros(3);
        pins.digitalWritePin(trigger, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trigger, 0);

        // read pulse and convert to cm
        let d = pins.pulseIn(echo, PulseValue.High, 23200);
        return Math.floor(d / 58.2);
    }

    //% blockId=missimo_ultrasonic_robot
    //% block="Messe Distanz in cm"
    //% block.loc.en="measure distance in cm"
    //% jsdoc.loc.en="measure distance in cm"
    //% color=#25db9c
    //% weight=100
    //% blockGap=10
    export function measure_distance_avg(): number {
        let oldDist = measure_distance(DigitalPin.P8, DigitalPin.P2);
        let avg = oldDist;
        for (let index = 0; index <= 10; index++)
        {
            let dist = measure_distance(DigitalPin.P8, DigitalPin.P2);
            avg = (0.8 * oldDist) + (0.2 * dist);
            control.waitMicros(10);
        }
        return Math.floor(avg);
    }

}